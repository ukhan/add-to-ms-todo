const randomstring = require('randomstring');
const urlParse = require('url-parse');

import notification from './notification';
import storage from './storage';

const oauthURL = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirect_uri = chrome.identity.getRedirectURL();
const permissions = [
  'https://outlook.office.com/user.read',
  'https://outlook.office.com/tasks.readwrite',
  'offline_access'
];
const scope = permissions.join('%20');

/**
 * @enum {string}
 */
export const CheckAuthMethod = {
  FAST: 'fast',
  NORMAL: 'normal',
  FORCE: 'force'
};

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

export function refreshToken(refresh_token) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'refresh-token', refresh_token }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      }
      resolve(response.token);
    });
  }).catch(message => notification(message));
}

function isExpired(expiredAt) {
  const TOKEN_EXPIRATION_DELTA = 30;
  return expiredAt < timestamp() + TOKEN_EXPIRATION_DELTA;
}

function timestamp() {
  return Math.round(Date.now() / 1000);
}

export async function getToken(force = false) {
  const { access_token, expired_at, refresh_token } = await storage.get([
    'access_token',
    'expired_at',
    'refresh_token'
  ]);

  if ((isExpired(expired_at) || force) && refresh_token) {
    return await refreshToken(refresh_token);
  } else {
    return access_token || '';
  }
}

export function bgRefreshToken(refresh_token) {
  return new Promise((resolve, reject) => {
    fetch(`${oauthURL}/token`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=${clientID}&scope=${scope}&refresh_token=${refresh_token}&grant_type=refresh_token&client_secret=${clientSecret}`
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          reject(response.statusText);
        }
      })
      .then(data => {
        storage.set({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expired_at: timestamp() + data.expires_in
        });
        resolve(data.access_token);
      })
      .catch(err => reject(err));
  }).catch(err => {
    logout();
    notification(err.message);
  });
}

export function login() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'auth' }, profile => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      }
      resolve(profile);
    });
  }).catch(message => notification(message));
}

export function bgAuth() {
  const state = randomstring.generate(12);
  const authURL = `${oauthURL}/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirect_uri}&response_mode=query&scope=${scope}&state=${state}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authURL,
        interactive: true
      },
      responseUrl => {
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
            'Content-type': 'application/x-www-form-urlencoded'
          },
          body: `client_id=${clientID}&scope=${scope}&code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code&client_secret=${clientSecret}&code_verifier=${state}`
        })
          .then(response => response.json())
          .then(data => {
            storage.set({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expired_at: timestamp() + data.expires_in
            });

            resolve(data.access_token);
          })
          .catch(err => reject(err.message));
      }
    );
  }).catch(message => {
    logout();
    notification(message);
  });
}

export function bgMe(token) {
  if (!token) return;

  return new Promise((resolve, reject) => {
    fetch('https://outlook.office.com/api/v2.0/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const me = { name: data.DisplayName, email: data.EmailAddress };
        storage.set(me);
        resolve(me);
      })
      .catch(err => {
        reject(err.message);
      });
  }).catch(message => notification(message));
}

export function me() {
  return storage.get(['name', 'email']);
}

export function logout() {
  storage.remove(['access_token', 'refresh_token', 'expired_at', 'name', 'email']);
}
