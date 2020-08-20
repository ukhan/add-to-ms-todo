import { t } from './i18n';
import { isAuthenticated } from './auth';

export function createQuickAddMenu() {
  isAuthenticated().then((is) => {
    if (is) {
      chrome.contextMenus.create(
        {
          id: 'QUICK_ADD_TASK',
          title: t('QuickAddCommandDescription'),
          contexts: ['page', 'selection', 'link', 'image'],
        },
        () => {
          chrome.runtime.lastError;
        }
      );
    }
  });
}

export function removeQuickAddMenu() {
  chrome.contextMenus.remove('QUICK_ADD_TASK', () => {
    chrome.runtime.lastError;
  });
}

export function createDebugMenu() {
  chrome.contextMenus.create(
    {
      id: 'VIEW_DEBUG_INFO',
      title: t('ViewDebugInfo'),
      contexts: ['browser_action'],
    },
    () => {
      chrome.runtime.lastError;
    }
  );
}

export function removeDebugMenu() {
  chrome.contextMenus.remove('VIEW_DEBUG_INFO', () => {
    chrome.runtime.lastError;
  });
}
