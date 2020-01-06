import { bgAuth, bgMe, bgRefreshToken } from './helpers/auth';
import { t } from './helpers/i18n';
import { bgGetFolders, bgAddTask, quickAddTask } from './helpers/task';

const TODO_URL = 'https://to-do.microsoft.com/';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'OPEN_TODO',
    title: t('OpenMicrosoftToDo'),
    contexts: ['browser_action']
  });
  chrome.contextMenus.create({
    id: 'QUICK_ADD_TASK',
    title: t('QuickAddCommandDescription'),
    contexts: ['page', 'selection']
  });
});

chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'OPEN_TODO') {
    chrome.tabs.create({
      url: TODO_URL
    });
  } else if (info.menuItemId === 'QUICK_ADD_TASK') {
    quickAddTask();
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
