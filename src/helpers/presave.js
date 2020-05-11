const PRESAVE_KEY = 'presave';
const GARBAGE_COLLECT_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

export function preSave(task, tabInfo) {
  loadStates().then(states => {
    states[tabInfo.id] = {
      dt: Date.now(),
      url: tabInfo.url,
      task
    };
    saveStates(states);
  });
}

export function preLoad(tabInfo) {
  return new Promise((resolve, reject) => {
    loadStates()
      .then(states => {
        let task =
          states[tabInfo.id] && states[tabInfo.id].url === tabInfo.url
            ? states[tabInfo.id].task
            : undefined;
        resolve({ task, tabInfo });
      })
      .catch(reject);
  });
}

export function preDelete(tabId) {
  loadStates().then(states => {
    delete states[tabId];
    states = garbageCollector(states);
    saveStates(states);
  });
}

export function preClear() {
  chrome.storage.local.remove(PRESAVE_KEY);
}

function loadStates() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(PRESAVE_KEY, function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }

      resolve(result[PRESAVE_KEY] || {});
    });
  });
}

function saveStates(states) {
  let ps = {};
  ps[PRESAVE_KEY] = states;
  chrome.storage.local.set(ps);
}

function garbageCollector(states) {
  let dt = Date.now();
  let clean = {};

  for (let [id, val] of Object.entries(states)) {
    if (dt - val.dt < GARBAGE_COLLECT_INTERVAL) {
      clean[id] = val;
    }
  }

  return clean;
}
