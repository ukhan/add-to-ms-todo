const randomstring = require('randomstring');
const urlParse = require('url-parse');
import { create as createPKCE } from 'pkce';

import notification from './notification';
import storage from './encrypted-storage';
import { safeJson } from './fetch';
import { set as setConfig, get as getConfig } from './config';
import { createQuickAddMenu, removeQuickAddMenu } from './context-menu';
import { t } from './i18n';

export const oauthURL = 'https://login.microsoftonline.com/common/oauth2/v2.0';
export const clientID = process.env.CLIENT_ID;
export const redirect_uri = chrome.identity.getRedirectURL();
const permissions = [
  'https://outlook.office.com/user.read',
  'https://outlook.office.com/tasks.readwrite',
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
      access_token = await storage.get('access_token');
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
  const {
    access_token,
    expired_at,
    refresh_token,
    refresh_token_expired_at,
  } = await storage.get([
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
        storage.set({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expired_at: timestamp() + data.expires_in,
          refresh_token_expired_at: timestamp() + refreshTokenLifetime,
        });
        resolve(data.access_token);
      })
      .catch((err) => reject(err));
  }).catch((err) => {
    storage.remove([
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

  setAuthInProgressStatus(true);
  isAuthenticated().then((res) => (itRefresh = res));

  function setAuthInProgressStatus(status) {
    chrome.extension.getBackgroundPage().authInProcess = status;
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
    removeTabListeners();
    clearTimeout(timerUntilAuthTabActivate);
    chrome.tabs.remove(authTabId);
    goLastTab();
    if (!itRefresh) {
      notification(t('authSuccess'));
    }
  }

  function moveAuthTabForeground() {
    if (tryBg) chrome.tabs.update(authTabId, { active: true });
  }

  function goLastTab() {
    chrome.tabs.update(lastTabId, { active: true });
  }

  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    lastTabId = tabs[0].id;
    chrome.storage.local.set({ [BEFORE_AUTH_TAB_ID_KEY]: tabs[0].id });
  });

  chrome.tabs.create(
    {
      url,
      active: !tryBg,
    },
    (tab) => {
      authTabId = tab.id;
      chrome.storage.local.set({ [AUTH_TAB_ID_KEY]: tab.id });
      addTabListeners();
      timerUntilAuthTabActivate = setTimeout(() => {
        moveAuthTabForeground();
      }, TIME_UNTIL_AUTH_TAB_ACTIVATE);
    }
  );
}

export function bgAuth(tryUseCookie = false) {
  const state = randomstring.generate(12);
  const { codeVerifier, codeChallenge } = createPKCE();

  let authURL = `${oauthURL}/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirect_uri}&response_mode=query&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  if (!tryUseCookie) {
    authURL += '&prompt=login';
  }

  chrome.storage.local.set({ [CODE_VERIFIER_KEY]: codeVerifier });

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
            storage.set({
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
    fetch('https://outlook.office.com/api/v2.0/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'omit',
    })
      .then(safeJson)
      .then((data) => {
        const me = { name: data.DisplayName, email: data.EmailAddress };
        storage.set(me);
        resolve(me);
      })
      .catch((err) => {
        reject(err.message);
      });
  }).catch((message) => notification(message));
}

export function me() {
  return storage.get(['name', 'email']);
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
  storage.remove([
    'access_token',
    'refresh_token',
    'expired_at',
    'refresh_token_expired_at',
    'name',
    'email',
  ]);
}
