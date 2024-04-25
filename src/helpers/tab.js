export default function getTabInfo() {
  return Promise.all([
    new Promise((resolve, reject) => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }
        if (!tabs.length) {
          resolve({
            title: '',
            url: '',
            id: null,
          });
        }

        let tab = tabs[0];
        resolve({
          title: tab.title,
          url: tab.url,
          id: tab.id,
        });
      });
    }),
    new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }
        if (!tabs.length) {
          resolve({
            selected: '',
          });
        }
        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            function: () => {
              return window.getSelection().toString();
            },
          })
          .then((result) => {
            resolve({
              selected: result[0].result || '',
            });
          })
          .catch(() => {
            resolve({
              selected: '',
            });
          });
      });
    }),
  ]).then((info) => {
    return { ...info[0], ...info[1] };
  });
}
