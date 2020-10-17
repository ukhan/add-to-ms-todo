import { t } from './i18n';
import { isFirefox } from './browser';

const notificationTimeout = 5000; // in milliseconds

export function notification(message, requireInteraction = false, cb) {
  if (typeof message === 'object') {
    message = message.message;
  }

  return new Promise((resolve) => {
    let notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/todo-128.png',
      title: t('extName'),
      message,
    };
    let chromiumOptions = {
      requireInteraction,
      silent: true,
    };
    if (!isFirefox()) {
      notificationOptions = { ...notificationOptions, ...chromiumOptions };
    }
    chrome.notifications.create(notificationOptions, (id) => {
      if (typeof cb === 'function') {
        cb();
      }
      resolve(id);
    });
  });
}

export function closeNotification(id) {
  setTimeout(() => {
    chrome.notifications.clear(id);
  }, notificationTimeout);
}

export default notification;
