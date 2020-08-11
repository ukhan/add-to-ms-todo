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
      v-if="isReviewButtonVisible"
      icon="el-icon-medal-1"
      size="medium"
      :title="t('RateExtension')"
      @click="goReviews"
      type="info"
      plain
    ></el-button>
    <el-button
      v-if="isIssueButtonVisible"
      icon="el-icon-warning-outline"
      size="medium"
      :title="t('ReportBug')"
      @click="goSupport"
      type="info"
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
    };
  },

  computed: {
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

    goReviews() {
      pages.reviews();
    },

    goSupport() {
      pages.support();
    },

    async logout() {
      await logout();
      this.$emit('logout');
    },

    t,
  },
};
</script>
