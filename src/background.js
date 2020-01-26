import { bgAuth, bgMe, bgRefreshToken } from './helpers/auth';
import { t } from './helpers/i18n';
import { bgGetFolders, bgAddTask, quickAddTask } from './helpers/task';
import pages from './helpers/pages';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'OPEN_TODO',
    title: t('OpenMicrosoftToDo'),
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    id: 'OPEN_REVIEWS_PAGE',
    title: t('RateExtension'),
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    id: 'OPEN_SUPPORT_PAGE',
    title: t('ReportBug'),
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    id: 'QUICK_ADD_TASK',
    title: t('QuickAddCommandDescription'),
    contexts: ['page', 'selection']
  });
});

chrome.contextMenus.onClicked.addListener(info => {
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
    case 'QUICK_ADD_TASK':
      quickAddTask();
      break;
  }
});

chrome.commands.onCommand.addListener(command => {
  console.log('Command:', command);
  if (command === 'QUICK_ADD') {
    quickAddTask();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'AUTH') {
    bgAuth()
      .then(token => bgMe(token))
      .then(profile => sendResponse(profile));
    return true;
  } else if (request.action === 'REFRESH_TOKEN') {
    bgRefreshToken(request.refresh_token).then(token =>
      sendResponse({ token })
    );
    return true;
  } else if (request.action === 'GET_FOLDERS') {
    bgGetFolders(request.access_token).then(folders =>
      sendResponse({ folders })
    );
    return true;
  } else if (request.action === 'ADD_TASK') {
    bgAddTask(request.access_token, request.task)
      .then(response => {
        sendResponse({ ok: true, response });
      })
      .catch(response => {
        sendResponse({ ok: false, response });
      });
    return true;
  }
});
