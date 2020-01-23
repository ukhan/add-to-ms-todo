const TODO_URL = 'https://to-do.microsoft.com/';
const WEBSTORE_BASE_URL = 'https://chrome.google.com/webstore/detail';
const EXT_SLUG = 'add-to-microsoft-to-do';
const EXT_ID = 'loblkkbfciiklgoblkigehhghfjfjede';
const REVIEWS_URL = `${WEBSTORE_BASE_URL}/${EXT_SLUG}/${EXT_ID}/reviews`;
const SUPPORT_URL = `${WEBSTORE_BASE_URL}/${EXT_SLUG}/${EXT_ID}/support`;

function openUrl(url) {
  chrome.tabs.create({ url });
}

export default {
  todo() {
    openUrl(TODO_URL);
  },
  reviews() {
    openUrl(REVIEWS_URL);
  },
  support() {
    openUrl(SUPPORT_URL);
  }
};
