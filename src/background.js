import { bgAuth, bgMe, bgRefreshToken } from './helpers/auth';
import { t } from './helpers/i18n';
import { bgGetFolders, bgAddTask, quickAddTask } from './helpers/task';
import { closeNotification } from './helpers/notification';
import { preDelete } from './helpers/presave';
import config from './helpers/config';
import pages from './helpers/pages';
import log from './helpers/log';
import {
  createQuickAddMenu,
  removeQuickAddMenu,
  createDebugMenu,
  removeDebugMenu,
} from './helpers/context-menu';
import semver from './helpers/semver';
import storage from './helpers/storage';

chrome.runtime.onInstalled.addListener((details) => {
  let currentVersion = semver(chrome.runtime.getManifest().version);

  if (details.reason === 'update') {
    let previousVersion = semver(details.previousVersion);

    if (
      parseInt(previousVersion.minor) < 21 &&
      currentVersion.minor === '21' &&
      currentVersion.major === '0'
    ) {
      chrome.notifications.create(
        {
          type: 'basic',
          iconUrl: 'icons/todo-128.png',
          title: t('extName'),
          message: t('extIsUpdated'),
          requireInteraction: true,
          silent: true,
        },
        (notificationId) => {
          chrome.notifications.onClicked.addListener(
            (clickedNotificationId) => {
              if (clickedNotificationId === notificationId) {
                chrome.tabs.create({
                  url: 'https://github.com/ukhan/add-to-ms-todo/blob/master/CHANGELOG.md',
                });
                chrome.notifications.clear(notificationId);
              }
            }
          );
        }
      );
    }
  }

  chrome.contextMenus.create({
    id: 'OPEN_TODO',
    title: t('OpenMicrosoftToDo'),
    contexts: ['browser_action'],
  });
  chrome.contextMenus.create({
    id: 'OPEN_REVIEWS_PAGE',
    title: t('RateExtension'),
    contexts: ['browser_action'],
  });
  chrome.contextMenus.create({
    id: 'OPEN_SUPPORT_PAGE',
    title: t('ReportBug'),
    contexts: ['browser_action'],
  });

  config.get().then((cfg) => {
    if (cfg.quickAddTaskInContextMenu) {
      createQuickAddMenu();
    }

    if (cfg.saveDebugInfo) {
      createDebugMenu();
    }
  });
});

config.onChanged((newConfig) => {
  if (newConfig.quickAddTaskInContextMenu) {
    createQuickAddMenu();
  } else {
    removeQuickAddMenu();
  }

  if (newConfig.saveDebugInfo) {
    createDebugMenu();
  } else {
    log.clear();
    removeDebugMenu();
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  switch (info.menuItemId) {
    case 'OPEN_TODO':
      pages.todo();
      break;
    case 'OPEN_REVIEWS_PAGE':
      pages.reviews();
      break;
    case 'OPEN_SUPPORT_PAGE':
      pages.support();
      break;
    case 'VIEW_DEBUG_INFO':
      pages.log();
      break;
    case 'QUICK_ADD_TASK':
      quickAddTask(info);
      break;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'QUICK_ADD') {
    quickAddTask();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'AUTH') {
    bgAuth()
      .then((token) => bgMe(token))
      .then((profile) => sendResponse(profile));
    return true;
  } else if (request.action === 'REFRESH_TOKEN') {
    bgRefreshToken(request.refresh_token, request.expired_at).then((token) =>
      sendResponse({ token })
    );
    return true;
  } else if (request.action === 'GET_FOLDERS') {
    bgGetFolders(request.access_token).then((folders) =>
      sendResponse({ folders })
    );
    return true;
  } else if (request.action === 'ADD_TASK') {
    bgAddTask(request.access_token, request.task)
      .then((response) => {
        sendResponse({ ok: true, response });
      })
      .catch((response) => {
        sendResponse({ ok: false, response });
      });
    return true;
  } else if (request.action === 'CLOSE_NOTIFICATION') {
    closeNotification(request.id);
  }
});

chrome.tabs.onRemoved.addListener(preDelete);

// In case if Background script gone to inactive state when auth was in process

const urlParse = require('url-parse');
import notification from './helpers/notification';
import encStorage from './helpers/encrypted-storage';
import {
  BEFORE_AUTH_TAB_ID_KEY,
  AUTH_TAB_ID_KEY,
  CODE_VERIFIER_KEY,
  refreshTokenLifetime,
  oauthURL,
  clientID,
  timestamp,
  scope,
  redirect_uri,
  clearAuthTempData,
} from './helpers/auth';

let authInProcess = false;
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.authInProcess) {
    authInProcess = changes.authInProcess.newValue;
  }
});
chrome.storage.local.set({ authInProcess });

function gotoBeforeAuthTab() {
  storage.local.get([BEFORE_AUTH_TAB_ID_KEY], function (result) {
    chrome.tabs.get(result[BEFORE_AUTH_TAB_ID_KEY], (tab) => {
      if (!chrome.runtime.lastError && tab) {
        chrome.tabs.update(tab.id, {
          active: true,
        });
      }
    });
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!authInProcess) {
    storage.local.get([AUTH_TAB_ID_KEY, CODE_VERIFIER_KEY], function (result) {
      let authTabId = result[AUTH_TAB_ID_KEY];
      let codeVerifier = result[CODE_VERIFIER_KEY];

      function closeAuthTab() {
        gotoBeforeAuthTab();
        clearAuthTempData();
        chrome.tabs.query({}, (tabs) => {
          if (tabs.length === 1) {
            chrome.tabs.create({}, () => {
              chrome.tabs.remove(authTabId);
            });
          } else {
            chrome.tabs.remove(authTabId);
          }
        });
      }

      if (tabId === authTabId) {
        if (changeInfo.status === 'complete') {
          let q = urlParse(tab.url, true).query;

          if ('code' in q) {
            closeAuthTab();
            let { code } = urlParse(tab.url, true).query;

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
                  throw new Error(data.error_description.split(/\r?\n/)[0]);
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
                bgMe(data.access_token);
                notification(t('authSuccess'));
              })
              .catch((err) => notification(err.message));
          } else if ('error' in q) {
            closeAuthTab();
            notification(q.error_description);
          }
        }
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (!authInProcess) {
    storage.local.get([AUTH_TAB_ID_KEY], function (result) {
      if (tabId === result[AUTH_TAB_ID_KEY]) {
        chrome.storage.local.set({ authInProcess: false });
        gotoBeforeAuthTab();
        clearAuthTempData();
        notification(t('UserCancelAuth'));
      }
    });
  }
});
