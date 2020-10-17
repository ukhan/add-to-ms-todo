import { isFirefox } from './browser';

function encodeObject(obj, needEncode) {
  let encodedObj = {};

  if (needEncode) {
    for (let prop in obj) {
      encodedObj[prop] = JSON.stringify(obj[prop]);
    }
  } else {
    encodedObj = obj;
  }

  return encodedObj;
}

function decodeObject(obj, needDecode) {
  let decodedObj = {};

  if (needDecode) {
    for (let prop in obj) {
      decodedObj[prop] =
        typeof obj[prop] === 'string' ? JSON.parse(obj[prop]) : obj[prop];
    }
  } else {
    decodedObj = obj;
  }

  return decodedObj;
}

function localSet(items, cb) {
  chrome.storage.local.set(encodeObject(items, isFirefox()), cb);
}

function localGet(keys, cb) {
  chrome.storage.local.get(keys, (result) => {
    cb(decodeObject(result, isFirefox()));
  });
}

function syncSet(items, cb) {
  chrome.storage.sync.set(encodeObject(items, isFirefox()), cb);
}

function syncGet(keys, cb) {
  chrome.storage.sync.get(keys, (result) => {
    cb(decodeObject(result, isFirefox()));
  });
}

export default {
  local: {
    set: localSet,
    get: localGet,
  },
  sync: {
    set: syncSet,
    get: syncGet,
  },
};
