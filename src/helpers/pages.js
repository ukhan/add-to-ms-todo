import { isFirefox } from './browser';

const TODO_URL = 'https://to-do.live.com/tasks/';
const EXT_SLUG = 'add-to-microsoft-to-do';
const CHROME_EXT_ID = 'loblkkbfciiklgoblkigehhghfjfjede';
const EDGE_EXT_ID = 'gmlpcoahadjmjhgipekkeickjllmllho';
const CHROME_REVIEWS_URL = `https://chrome.google.com/webstore/detail/${EXT_SLUG}/${CHROME_EXT_ID}/reviews`;
const EDGE_REVIEWS_URL = `https://microsoftedge.microsoft.com/addons/detail/${EXT_SLUG}/${EDGE_EXT_ID}`;
const FIREFOX_REVIEWS_URL = `https://addons.mozilla.org/firefox/addon/${EXT_SLUG}/`;
const SUPPORT_URL = `https://github.com/ukhan/add-to-ms-todo/issues`;

function openUrl(url) {
  chrome.tabs.create({ url });
}

export default {
  todo() {
    openUrl(TODO_URL);
  },
  reviews() {
    let review_url;

    if (isFirefox()) {
      review_url = FIREFOX_REVIEWS_URL;
    } else {
      review_url =
        chrome.runtime.id === EDGE_REVIEWS_URL
          ? EDGE_REVIEWS_URL
          : CHROME_REVIEWS_URL;
    }

    openUrl(review_url);
  },
  support() {
    openUrl(SUPPORT_URL);
  },
  log() {
    openUrl(chrome.runtime.getURL('log.html'));
  },
};
