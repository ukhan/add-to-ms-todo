import Vue from 'vue';
import UI from './components/UI.vue';

import './popup.css';

new Vue({
  el: '#ui',
  render: h => h(UI)
});

document.documentElement.lang = chrome.i18n.getMessage('@@ui_locale');
