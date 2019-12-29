import { bgAuth, bgMe, bgRefreshToken } from './helpers/auth';

const OPEN_TODO_MENU = 'open-todo';
const TODO_URL = 'https://to-do.microsoft.com/';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: OPEN_TODO_MENU,
    title: 'Open Microsoft To Do',
    contexts: ['browser_action']
  });
});

chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === OPEN_TODO_MENU) {
    chrome.tabs.create({
      url: TODO_URL
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'auth') {
    bgAuth()
      .then(token => bgMe(token))
      .then(profile => sendResponse(profile));
    return true;
  } else if (request.action === 'refresh-token') {
    const refresh_token = request.refresh_token;
    bgRefreshToken(refresh_token).then(token => sendResponse({ token }));
    return true;
  }
});
