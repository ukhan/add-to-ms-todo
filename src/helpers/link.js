export default function getLinkTitle(href) {
  return new Promise(resolve => {
    let code = `
      Array.from( document.querySelectorAll("[href='${href}']") )
        .map(el => el.innerText)
        .sort((t1, t2) => t1.length - t2.length)
        .pop()
    `;

    chrome.tabs.executeScript({ code }, function(results) {
      resolve(results.pop());
    });
  });
}
