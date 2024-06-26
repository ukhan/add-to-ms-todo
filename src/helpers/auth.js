const urlParse = require('url-parse');
import pkceChallenge from 'pkce-challenge';

import notification from './notification';
import encStorage from './encrypted-storage';
import storage from './storage';
import { safeJson } from './fetch';
import { set as setConfig, get as getConfig } from './config';
import { createQuickAddMenu, removeQuickAddMenu } from './context-menu';
import { t } from './i18n';

export const oauthURL = 'https://login.microsoftonline.com/common/oauth2/v2.0';
export const clientID = process.env.CLIENT_ID;
export const redirect_uri = chrome.identity.getRedirectURL();
const permissions = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Tasks.ReadWrite',
  'https://graph.microsoft.com/Tasks.ReadWrite.Shared',
  'offline_access',
];
export const scope = permissions.join('%20');

// Single page apps, however, get a token with a 24 hour lifetime, requiring a new authentication every day.
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow#refresh-the-access-token
export const refreshTokenLifetime = 24 * 60 * 60;

/**
 * @enum {string}
 */
export const CheckAuthMethod = {
  FAST: 'fast',
  NORMAL: 'normal',
  FORCE: 'force',
};

export const BEFORE_AUTH_TAB_ID_KEY = 'beforeAuthTabId';
export const AUTH_TAB_ID_KEY = 'authTabId';
export const CODE_VERIFIER_KEY = 'codeVerifier';

/**
 * @param {CheckAuthMethod} method
 */
export async function isAuthenticated(authMethod = CheckAuthMethod.FAST) {
  let access_token;

  switch (authMethod) {
    case CheckAuthMethod.FAST:
      access_token = await encStorage.get('access_token');
      break;
    case CheckAuthMethod.NORMAL:
      access_token = await getToken();
      break;
    case CheckAuthMethod.FORCE:
      access_token = await getToken(true);
      break;
  }

  return (access_token || '').length > 0;
}

export function refreshToken(refresh_token, expired_at) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'REFRESH_TOKEN', refresh_token, expired_at },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }
        resolve(response.token);
      }
    );
  }).catch((message) => notification(message));
}

function isExpired(expiredAt) {
  const TOKEN_EXPIRATION_DELTA = 30;
  return expiredAt < timestamp() + TOKEN_EXPIRATION_DELTA;
}

export function timestamp() {
  return Math.round(Date.now() / 1000);
}

/**
 * Get access token
 *
 * @param {Boolean} force Refresh even if not outdated
 * @param {Boolean} direct Direct refresh without sendMessage to background
 */
export async function getToken(force = false, direct = false) {
  const { access_token, expired_at, refresh_token, refresh_token_expired_at } =
    await encStorage.get([
      'access_token',
      'expired_at',
      'refresh_token',
      'refresh_token_expired_at',
    ]);

  if ((isExpired(expired_at) || force) && refresh_token) {
    if (direct) {
      return await bgRefreshToken(refresh_token, refresh_token_expired_at);
    } else {
      return await refreshToken(refresh_token, refresh_token_expired_at);
    }
  } else {
    return access_token || '';
  }
}

export function bgRefreshToken(refresh_token, expired_at) {
  if (isExpired(expired_at)) {
    return bgAuth(true);
  }

  return new Promise((resolve, reject) => {
    fetch(`${oauthURL}/token`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
      credentials: 'omit',
      body: `client_id=${clientID}&scope=${scope}&refresh_token=${refresh_token}&grant_type=refresh_token`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          return bgAuth(true).then((access_token) => resolve(access_token));
        } else {
          return data;
        }
      })
      .then((data) => {
        encStorage.set({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expired_at: timestamp() + data.expires_in,
          refresh_token_expired_at: timestamp() + refreshTokenLifetime,
        });
        resolve(data.access_token);
      })
      .catch((err) => reject(err));
  }).catch((err) => {
    encStorage.remove([
      'access_token',
      'refresh_token',
      'expired_at',
      'refresh_token_expired_at',
    ]);
    notification(err.message);
  });
}

export function login() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'AUTH' }, (profile) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      }
      resolve(profile);
    });
  }).catch((message) => notification(message));
}

function launchAltAuthFlow({ url, tryBg }, cb) {
  const TIME_UNTIL_AUTH_TAB_ACTIVATE = 5000;
  let timerUntilAuthTabActivate;
  let lastTabId, authTabId;
  let itRefresh = false;

  isAuthenticated().then((res) => (itRefresh = res));

  function setAuthInProgressStatus(status) {
    chrome.storage.local.set({ authInProcess: status });
  }

  async function getAuthInProgressStatus() {
    return (await chrome.storage.local.get('authInProcess')).authInProcess;
  }

  function authTabUpdatedHandle(tabId, changeInfo, tab) {
    if (tabId === authTabId) {
      if (changeInfo.status === 'complete') {
        let q = urlParse(tab.url, true).query;

        if ('code' in q) {
          closeAuthTab();
          cb(tab.url);
        } else if ('error' in q) {
          closeAuthTab();
          notification(q.error_description);
        }
      }
    }
  }

  function authTabClosedHandler(tabId) {
    if (tabId === authTabId) {
      removeTabListeners();
      goLastTab();
      setAuthInProgressStatus(false);
      clearAuthTempData();
      notification(t('UserCancelAuth'));
    }
  }

  function addTabListeners() {
    chrome.tabs.onUpdated.addListener(authTabUpdatedHandle);
    chrome.tabs.onRemoved.addListener(authTabClosedHandler);
  }

  function removeTabListeners() {
    chrome.tabs.onUpdated.removeListener(authTabUpdatedHandle);
    chrome.tabs.onRemoved.removeListener(authTabClosedHandler);
  }

  function closeAuthTab() {
    let localAuthTabId = authTabId;

    authTabId = undefined;
    clearAuthTempData();
    removeTabListeners();
    clearTimeout(timerUntilAuthTabActivate);
    chrome.tabs.query({}, (tabs) => {
      if (tabs.length === 1) {
        chrome.tabs.create({}, () => {
          chrome.tabs.remove(localAuthTabId);
        });
      } else {
        chrome.tabs.remove(localAuthTabId);
      }
    });
    goLastTab();
    if (!itRefresh) {
      notification(t('authSuccess'));
    }
  }

  function moveAuthTabForeground() {
    if (tryBg) chrome.tabs.update(authTabId, { active: true });
  }

  function goLastTab() {
    chrome.tabs.get(lastTabId, (tab) => {
      if (!chrome.runtime.lastError && tab) {
        chrome.tabs.update(tab.id, { active: true });
      }
    });
  }

  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    lastTabId = tabs[0].id;
    storage.local.set({ [BEFORE_AUTH_TAB_ID_KEY]: tabs[0].id });
  });

  function setupAuthProcess(tabId) {
    setAuthInProgressStatus(true);
    authTabId = tabId;
    storage.local.set({ [AUTH_TAB_ID_KEY]: tabId });
    addTabListeners();
    timerUntilAuthTabActivate = setTimeout(() => {
      moveAuthTabForeground();
    }, TIME_UNTIL_AUTH_TAB_ACTIVATE);
  }

  function createAuthTab() {
    chrome.tabs.create(
      {
        url,
        active: !tryBg,
      },
      (tab) => {
        setupAuthProcess(tab.id);
      }
    );
  }

  function updateAuthTab(tabId) {
    chrome.tabs.update(
      tabId,
      {
        url,
        active: !tryBg,
      },
      async (tab) => {
        if (!(await getAuthInProgressStatus())) {
          setupAuthProcess(tab.id);
        }
      }
    );
  }

  storage.local.get([AUTH_TAB_ID_KEY], function (result) {
    let authTabId = result[AUTH_TAB_ID_KEY];

    if (authTabId) {
      // Check if authTab still exists
      chrome.tabs.get(authTabId, (tab) => {
        if (chrome.runtime.lastError) {
          createAuthTab();
        } else {
          updateAuthTab(tab.id);
        }
      });
    } else {
      createAuthTab();
    }
  });
}

export function clearAuthTempData() {
  chrome.storage.local.remove([
    BEFORE_AUTH_TAB_ID_KEY,
    AUTH_TAB_ID_KEY,
    CODE_VERIFIER_KEY,
  ]);
}

export async function bgAuth(tryUseCookie = false) {
  const state = Math.random().toString(36).substring(2, 14);
  const { code_verifier: codeVerifier, code_challenge: codeChallenge } =
    await pkceChallenge(128);

  let authURL = `${oauthURL}/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirect_uri}&response_mode=query&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  if (!tryUseCookie) {
    authURL += '&prompt=login';
  }

  storage.local.set({ [CODE_VERIFIER_KEY]: codeVerifier });

  return new Promise((resolve, reject) => {
    launchAltAuthFlow(
      {
        url: authURL,
        tryBg: tryUseCookie,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }

        let { code, state: responseState } = urlParse(responseUrl, true).query;
        if (responseState !== state) {
          reject('Cross-site request forgery attack detected.');
        }

        fetch(`${oauthURL}/token`, {
          method: 'POST',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded',
          },
          credentials: 'omit',
          body: `client_id=${clientID}&scope=${scope}&code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code&code_verifier=${codeVerifier}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.error) {
              reject(data.error_description.split(/\r?\n/)[0]);
            } else {
              return data;
            }
          })
          .then((data) => {
            encStorage.set({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expired_at: timestamp() + data.expires_in,
              refresh_token_expired_at: timestamp() + refreshTokenLifetime,
            });
            createQuickAddMenu();
            resolve(data.access_token);
          })
          .catch((err) => reject(err.message));
      }
    );
  }).catch((message) => {
    authClear();
    notification(message);
  });
}

export function bgMe(token) {
  if (!token) return;

  return new Promise((resolve, reject) => {
    fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'omit',
    })
      .then(safeJson)
      .then((data) => {
        const me = { name: data.displayName, email: data.mail };
        encStorage.set(me);
        resolve(me);
      })
      .catch((err) => {
        reject(err.message);
      });
  }).catch((message) => notification(message));
}

export function me() {
  return encStorage.get(['name', 'email']);
}

export function logout() {
  chrome.storage.local.clear();
  removeQuickAddMenu();
  resetDefaultList();
  authClear();
}

function resetDefaultList() {
  getConfig().then((cfg) => {
    cfg.listDefault = '';
    setConfig(cfg);
  });
}

function authClear() {
  encStorage.remove([
    'access_token',
    'refresh_token',
    'expired_at',
    'refresh_token_expired_at',
    'name',
    'email',
  ]);
}
