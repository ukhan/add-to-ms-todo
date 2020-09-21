import { currentLocale } from './i18n';
const CONFIG_KEY = 'cfg';

const isCyrillic = currentLocale === 'uk' || currentLocale === 'ru';

const defaultConfig = {
  dateFormat: isCyrillic ? 'dd.MM.yyyy' : 'MM/dd/yyyy',
  timeFormat: isCyrillic ? '24h' : '12h',
  timeDefault: '10:00',
  timeStart: '00:00',
  timeEnd: '23:59',
  timeStep: '0:30',
  useLastUsedTime: true,
  firstDayOfWeek: isCyrillic ? 1 : 7,
  listDefault: '',
  useLastUsedList: false,
  showReminderDate: true,
  showDueDate: false,
  preFill: true,
  notifyOnSuccess: true,
  showButtons: ['settings', 'toggle'], // 'settings', 'toggle', 'logout'
  quickAddTaskInContextMenu: true,
  saveDebugInfo: false,
};

export function get() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(CONFIG_KEY, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }

      let config = items[CONFIG_KEY] || {};
      resolve({ ...defaultConfig, ...config });
    });
  });
}

/**
 * @param {Object} config
 */
export function set(config) {
  return new Promise((resolve, reject) => {
    let cfg = {};

    cfg[CONFIG_KEY] = config;
    chrome.storage.sync.set(cfg, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }

      resolve();
    });
  });
}

export function reset() {
  chrome.storage.sync.remove(CONFIG_KEY);
}

export function onChanged(cb) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && CONFIG_KEY in changes) {
      cb(changes[CONFIG_KEY].newValue, changes[CONFIG_KEY].oldValue);
    }
  });
}

export default {
  get,
  set,
  reset,
  onChanged,
};
