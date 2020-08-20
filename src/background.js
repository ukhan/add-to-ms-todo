import { bgAuth, bgMe, bgRefreshToken } from './helpers/auth';
import { currentLocale, t } from './helpers/i18n';
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

chrome.runtime.onInstalled.addListener(() => {
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
    bgRefreshToken(request.refresh_token).then((token) =>
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

setSurvey(currentLocale);

function setSurvey(locale) {
  let url;

  switch (locale) {
    case 'uk':
    case 'ru':
      url =
        'https://docs.google.com/forms/d/e/1FAIpQLScaL7W5yYBDGanpF2OOumeiHft6bFoCuSHh8B_HeC04OX3Hdg/viewform';
      break;
    default:
      url =
        'https://docs.google.com/forms/d/e/1FAIpQLSeQFxY8T8lSi-k8z3DQ4BmPpFOqQr4ewVCGINldjnwh4M3W6A/viewform';
  }

  chrome.runtime.setUninstallURL(url);
}
