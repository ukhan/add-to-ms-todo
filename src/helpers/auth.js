const randomstring = require('randomstring');
const urlParse = require('url-parse');

import notification from './notification';
import storage from './storage';

const oauthURL = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const scope = 'https://outlook.office.com/tasks.readwrite';
const redirect_uri = chrome.identity.getRedirectURL();

export async function isAuthenticated() {
  const accessToken = (await getToken()) || '';
  return accessToken.length > 0;
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

export async function getToken() {
  const { access_token, expired_at, refresh_token } = await storage.get([
    'access_token',
    'expired_at',
    'refresh_token'
  ]);

  if (isExpired(expired_at) && refresh_token) {
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
      body: `client_id=${clientID}&scope=offline_access%20${scope}&refresh_token=${refresh_token}&grant_type=refresh_token&client_secret=${clientSecret}`
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
      .catch(err => {
        storage.remove(['access_token', 'refresh_token', 'expired_at']);
        reject(err.message);
      });
  });
}

export function auth() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'auth' }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      }
      resolve(response.token);
    });
  }).catch(message => notification(message));
}

export function bgAuth() {
  const state = randomstring.generate(12);
  const authURL = `${oauthURL}/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirect_uri}&response_mode=query&scope=offline_access%20${scope}&state=${state}`;

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
    storage.remove(['access_token', 'refresh_token', 'expired_at']);
    notification(message);
  });
}
