const LOG_KEY = 'log';
const LOG_ENTRIES_LIMIT = 50;
const VERSION = require('../../package.json').version;

export async function add(entry) {
  let entries = await get();
  let items = {};

  entries.push(JSON.stringify(entry));
  entries = entries.slice(-LOG_ENTRIES_LIMIT);
  items[LOG_KEY] = entries;

  chrome.storage.local.set(items);
  if (chrome.runtime.lastError) {
    clear();
  }
}

export function addRequest(limit, timeout, method, url, body = null) {
  let entry = {
    Request: `${method} ${url}`,
    Meta: `${dt()} ${limit}:${timeout} ${VERSION}`
  };
  if (body) entry['body'] = JSON.parse(body);
  add(entry);
}

export function addResponse(response) {
  let entry = {
    Response: response,
    Meta: dt()
  };
  add(entry);
}

function dt() {
  let d = new Date();
  return d.toISOString();
}

export function get() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(LOG_KEY, items => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(items[LOG_KEY] || []);
    });
  }).catch(() => {
    return [];
  });
}

export function clear() {
  chrome.storage.local.remove(LOG_KEY);
}

export function onChanged(cb) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && LOG_KEY in changes) {
      cb(changes[LOG_KEY].newValue);
    }
  });
}

export default {
  add,
  addRequest,
  addResponse,
  get,
  clear,
  onChanged
};
