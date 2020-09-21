<template>
  <el-button-group v-if="isFewButtonsVisible">
    <el-button
      v-if="isLogoutButtonVisible"
      icon="el-icon-switch-button"
      :title="t('Logout') + ` [${profile.name}]`"
      size="medium"
      @click="logout"
      type="danger"
      plain
    ></el-button>
    <el-button
      v-if="isSettingsButtonVisible"
      icon="el-icon-setting"
      size="medium"
      :title="t('Settings')"
      @click="goSettings"
      type="primary"
      plain
    ></el-button>
    <el-button
      v-if="isToggleButtonVisible"
      :icon="toggleButtonIcon"
      :title="toggleButtonTitle"
      size="medium"
      @click="toggleForm"
      type="primary"
      plain
    ></el-button>
  </el-button-group>

  <div v-else>
    <el-button
      v-if="isLogoutButtonVisible"
      icon="el-icon-switch-button"
      :title="t('Logout') + ` [${profile.name}]`"
      size="medium"
      @click="logout"
      type="danger"
      plain
    ></el-button>
    <el-button
      v-if="isSettingsButtonVisible"
      icon="el-icon-setting"
      size="medium"
      :title="t('Settings')"
      @click="goSettings"
      type="primary"
      plain
    ></el-button>
    <el-button
      v-if="isToggleButtonVisible"
      :icon="toggleButtonIcon"
      :title="toggleButtonTitle"
      size="medium"
      @click="toggleForm"
      type="primary"
      plain
    ></el-button>

    <div class="made-with-love" v-show="noButtonsVisible">
      <div>
        <a
          href="https://github.com/ukhan/add-to-ms-todo/blob/master/CHANGELOG.md"
          target="_blank"
          >v {{ version }}</a
        >
      </div>
      <div>
        Made with
        <span class="love">❤</span> in
        <a href="https://madewithlove.in.ua" target="_blank">
          <img
            class="Ukraine"
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAuSURBVDhPYxgGQHHa5ygg/k8mjho1AGjAn+umUX9vmP4nB4P0jhoANGCoAwYGABPEurh8awULAAAAAElFTkSuQmCC"
          />
        </a>
        Ukraine by
        <a href="mailto:pavel.ukhan@gmail.com">Pavel Ukhan</a>
      </div>
    </div>
  </div>
</template>

<style>
.made-with-love {
  font-size: 0.6rem;
  line-height: 0.9rem;
  color: #909399;
  text-align: center;
  padding-left: 5px;
  padding-top: 8px;
}
.love {
  color: #e20338;
  cursor: pointer;
}
.Ukraine {
  padding-left: 2px;
  height: 12px;
  vertical-align: middle;
}
</style>

<script>
import { t } from '@/helpers/i18n';
import { logout } from '@/helpers/auth';
import pages from '@/helpers/pages';

const p = require('../../../package.json');

export default {
  name: 'ServiceButtons',

  props: {
    config: {
      type: Object,
      required: true,
    },
    profile: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      version: p.version,
      formFilled: this.config.preFill,
    };
  },

  computed: {
    isToggleButtonVisible() {
      return this.isButtonVisible('toggle', this.config);
    },
    isSettingsButtonVisible() {
      return this.isButtonVisible('settings', this.config);
    },
    isLogoutButtonVisible() {
      return this.isButtonVisible('logout', this.config);
    },
    isFewButtonsVisible() {
      return this.config.showButtons.length > 1;
    },
    noButtonsVisible() {
      return !this.config.showButtons.length;
    },
    toggleButtonTitle() {
      return this.formFilled ? this.t('ClearForm') : this.t('FillForm');
    },
    toggleButtonIcon() {
      return this.formFilled ? 'el-icon-delete' : 'el-icon-link';
    },
  },

  methods: {
    isButtonVisible(buttonName, config) {
      return config.showButtons.indexOf(buttonName) !== -1;
    },

    goSettings() {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    },

    async logout() {
      await logout();
      this.$emit('logout');
    },

    toggleForm() {
      this.formFilled = !this.formFilled;
      this.$emit('toggle', this.formFilled ? 'fill' : 'clear');
    },

    t,
  },
};
</script>
