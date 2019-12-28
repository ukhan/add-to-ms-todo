import t from './i18n';

export default function(message, requireInteraction = false) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/todo-128.png',
    title: t('extName'),
    message,
    requireInteraction
  });
}
