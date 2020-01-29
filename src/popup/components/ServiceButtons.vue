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

    <div class="made-with-love" v-show="noButtonsVisible">
      <div>ver {{ version }}</div>
      <div>
        Made with
        <span class="love">❤</span> in Ukraine by
        <a href="mailto:pavel.ukhan@gmail.com">Pavel Ukhan</a>
      </div>
    </div>
  </div>
</template>

<style>
.made-with-love {
  font-size: 0.6rem;
  color: #909399;
  text-align: center;
  padding-left: 5px;
  padding-top: 8px;
}
.love {
  color: #e20338;
  cursor: pointer;
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
      required: true
    },
    profile: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      version: p.version
    };
  },

  computed: {
    isSettingsButtonVisible() {
      return this.isButtonVisible('settings', this.config);
    },
    isReviewButtonVisible() {
      return this.isButtonVisible('review', this.config);
    },
    isIssueButtonVisible() {
      return this.isButtonVisible('issue', this.config);
    },
    isLogoutButtonVisible() {
      return this.isButtonVisible('logout', this.config);
    },
    isFewButtonsVisible() {
      return this.config.showButtons.length > 1;
    },
    noButtonsVisible() {
      return !this.config.showButtons.length;
    }
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

    t
  }
};
</script>
