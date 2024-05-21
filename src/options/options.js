import Vue from 'vue';
import ElementUI from 'element-ui';
import localeUK from 'element-ui/lib/locale/lang/ua';
import localeEN from 'element-ui/lib/locale/lang/en';
import 'element-ui/lib/theme-chalk/reset.css';
import 'element-ui/lib/theme-chalk/index.css';
import '../theme/dark.scss';
import setThemeSwitcher from '../theme/theme-switcher';
import { defaultLocale, currentLocale } from '../helpers/i18n';
import { get as getConfig } from '@/helpers/config';
import OptionsUI from './components/OptionsUI.vue';
import { isFirefox } from '@/helpers/browser';

const locales = {
  en: localeEN,
  uk: localeUK,
};

let locale =
  typeof locales[currentLocale] === 'undefined'
    ? locales[defaultLocale]
    : locales[currentLocale];

Vue.use(ElementUI, { locale });

new Vue({
  el: '#options-ui',
  data() {
    return {
      config: {},
    };
  },
  async created() {
    this.config = await getConfig();
  },
  render: (h) => h(OptionsUI),
});

const extName = chrome.i18n.getMessage('extName');
const settings = chrome.i18n.getMessage('Settings');
const title = chrome.i18n.getUILanguage().startsWith('en-')
  ? `${extName} ${settings}`
  : `${settings} ${extName}`;

document.documentElement.lang = currentLocale;
document.title = title;
document.getElementById('title').innerText = title;

setThemeSwitcher();
