import Vue from 'vue';
import ElementUI from 'element-ui';
import localeUK from 'element-ui/lib/locale/lang/ua';
import localeRU from 'element-ui/lib/locale/lang/ru-RU';
import localeEN from 'element-ui/lib/locale/lang/en';
import 'element-ui/lib/theme-chalk/reset.css';
import 'element-ui/lib/theme-chalk/index.css';
import '../theme/dark.scss';
import setThemeSwitcher from '../theme/theme-switcher';
import { defaultLocale, currentLocale } from '../helpers/i18n';
import { get as getConfig } from '@/helpers/config';
import UI from './components/UI.vue';

const locales = {
  en: localeEN,
  ru: localeRU,
  uk: localeUK
};

let locale =
  typeof locales[currentLocale] === 'undefined'
    ? locales[defaultLocale]
    : locales[currentLocale];

Vue.use(ElementUI, { locale });

new Vue({
  el: '#ui',
  data() {
    return {
      config: {}
    };
  },
  async created() {
    this.config = await getConfig();
  },
  render: h => h(UI)
});

document.documentElement.lang = currentLocale;
setThemeSwitcher();
