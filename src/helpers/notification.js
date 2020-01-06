import { t } from './i18n';

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
      requireInteraction
    },
    () => {
      if (typeof cb === 'function') {
        cb();
      }
    }
  );
}
