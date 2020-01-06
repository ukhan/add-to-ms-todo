import { encrypt, decrypt } from './cipher';

/**
 * @param {Object} items
 */
export function set(items) {
  let encryptedItems = {};

  for (let [key, value] of Object.entries(items)) {
    encryptedItems[key] = encrypt(value).toString();
  }

  chrome.storage.sync.set(encryptedItems);
}

/**
 * @param {(string|string[])} keys
 */
export function get(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, items => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }

      let decryptedItems = {},
        itemsCount = 0,
        singleKey;
      for (let [key, value] of Object.entries(items)) {
        decryptedItems[key] = decrypt(value);
        itemsCount++;
        singleKey = key;
      }

      if (itemsCount === 1) {
        resolve(decryptedItems[singleKey]);
      } else {
        resolve(decryptedItems);
      }
    });
  });
}

/**
 *
 * @param {(string|string[])} keys
 */
export function remove(keys) {
  chrome.storage.sync.remove(keys);
}

export default { set, get, remove };
