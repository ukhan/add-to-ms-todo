import { t } from './i18n';

const notificationTimeout = 5000; // in milliseconds

export default function(message, requireInteraction = false, cb) {
  if (typeof message === 'object') {
    message = message.message;
  }
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
      setTimeout(() => {
        chrome.notifications.clear(id);
      }, notificationTimeout);

      if (typeof cb === 'function') {
        cb();
      }
    }
  );
}
