import { t } from './i18n';

const notificationTimeout = 5000; // in milliseconds

export function notification(message, requireInteraction = false, cb) {
  if (typeof message === 'object') {
    message = message.message;
  }

  return new Promise(resolve => {
    chrome.notifications.create(
      {
        type: 'basic',
        iconUrl: 'icons/todo-128.png',
        title: t('extName'),
        message,
        requireInteraction,
        silent: true
      },
      id => {
        if (typeof cb === 'function') {
          cb();
        }
        resolve(id);
      }
    );
  });
}

export function closeNotification(id) {
  setTimeout(() => {
    chrome.notifications.clear(id);
  }, notificationTimeout);
}

export default notification;
