import { currentLocale } from '../helpers/i18n';
import log from '../helpers/log';

const PAGE_TITLE = 'Debug Info';
const LOG_DOM_EL = 'log';
const DELIMITER = '\n\n';

document.documentElement.lang = currentLocale;
document.title = PAGE_TITLE + ' – ' + chrome.i18n.getMessage('extName');

showLog();
log.onChanged(showLog);

async function showLog(entries) {
  if (entries === undefined) {
    entries = await log.get();
  }
  let text = entries
    .map(entry => JSON.stringify(JSON.parse(entry), null, 2))
    .join(DELIMITER);

  document.getElementById(LOG_DOM_EL).innerHTML = text || 'No entries yet.';
  window.scrollTo(0, document.body.scrollHeight);
}
