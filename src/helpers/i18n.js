import manifest from '../manifest/base.json';

export const defaultLocale = manifest.default_locale;

export const currentLocale = t('@@ui_locale');

export function t(message) {
  return chrome.i18n.getMessage(message);
}
