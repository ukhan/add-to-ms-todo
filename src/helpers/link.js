export default function getLinkTitle(href) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs) {
        chrome.scripting.executeScript(
          {
            func: (href) => {
              const r = Array.from(
                document.querySelectorAll(`[href='${href}']`)
              )
                .map((el) => el.innerText)
                .sort((t1, t2) => t1.length - t2.length)
                .pop();
              return r;
            },
            args: [href],
            target: { tabId: tabs[0].id },
          },
          (res) => {
            resolve(res[0].result);
          }
        );
      }
    });
  });
}
