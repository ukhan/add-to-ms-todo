<template>
  <el-form class="options-form" label-width="180px" slot="label">
    <el-form-item>
      <template slot="label">
        <i class="el-icon-user" :title="t('Account')"></i>
      </template>
      <div class="account-info">
        <div v-if="isAuthenticated">
          <span :title="profile.email">{{ profile.name }}</span> –
          <a href="#" @click="signOut">{{ t('Quit') }}</a>
        </div>
        <a href="#" @click="signIn" v-else>{{ t('SignIn') }}</a>
      </div>
    </el-form-item>

    <el-form-item :label="t('DateFormat')">
      <el-radio-group v-model="config.dateFormat">
        <el-radio class="col1" label="MM/dd/yyyy">{{
          getDateFormatLabel('MM/dd/yyyy')
        }}</el-radio>
        <el-radio label="dd.MM.yyyy">{{
          getDateFormatLabel('dd.MM.yyyy')
        }}</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item :label="t('TimeFormat')">
      <el-radio-group v-model="config.timeFormat">
        <el-radio class="col1" label="12h">{{
          getTimeFormatLabel('12h')
        }}</el-radio>
        <el-radio label="24h">{{ getTimeFormatLabel('24h') }}</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item :label="t('FirstDayOfTheWeek')">
      <el-radio-group v-model="config.firstDayOfWeek">
        <el-radio class="col1" :label="7">{{ t('Sunday') }}</el-radio>
        <el-radio :label="1">{{ t('Monday') }}</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- <el-form-item :label="t('ReminderTimeInterval')">
      <TimePicker
        class="reminder-interval-picker"
        v-model="config.timeStart"
        :format="config.timeFormat"
      />
      –
      <TimePicker
        class="reminder-interval-picker"
        v-model="config.timeEnd"
        :format="config.timeFormat"
      />
    </el-form-item> -->

    <el-form-item
      class="reminder-time-step"
      :class="{ en: enTranslate, 'no-en': !enTranslate }"
      :label="t('ReminderTimeStep')"
    >
      <el-select size="middle" v-model="config.timeStep">
        <el-option key="5" label="0:05" value="0:05"></el-option>
        <el-option key="10" label="0:10" value="0:10"></el-option>
        <el-option key="15" label="0:15" value="0:15"></el-option>
        <el-option key="30" label="0:30" value="0:30"></el-option>
        <el-option key="60" label="1:00" value="1:00"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item
      class="default-reminder-time"
      :class="{ en: enTranslate, 'no-en': !enTranslate }"
      :label="t('DefaultReminderTime')"
    >
      <TimePicker
        v-model="config.timeDefault"
        :step="config.timeStep"
        :format="config.timeFormat"
      />
      <el-tooltip
        class="item"
        effect="light"
        :content="t('RememberLastUsedTime')"
        placement="top"
      >
        <el-switch v-model="config.useLastUsedTime"></el-switch>
      </el-tooltip>
    </el-form-item>

    <el-form-item class="default-list" :label="t('DefaultList')">
      <el-select
        size="middle"
        v-model="config.listDefault"
        filterable
        v-if="isAuthenticated"
      >
        <el-option
          v-for="l in lists"
          :key="l.id"
          :label="l.label"
          :value="l.id"
        >
        </el-option>
      </el-select>
      <el-select
        size="middle"
        v-model="disabledLists"
        disabled=""
        v-else
      ></el-select>
    </el-form-item>

    <el-form-item :label="t('RememberLastUsedList')" label-width="350px">
      <el-switch v-model="config.useLastUsedList"></el-switch>
    </el-form-item>
    <el-form-item :label="t('ShowReminderDate')" label-width="350px">
      <el-switch v-model="config.showReminderDate"></el-switch>
    </el-form-item>
    <el-form-item :label="t('ShowDueDate')" label-width="350px">
      <el-switch v-model="config.showDueDate"></el-switch>
    </el-form-item>
    <el-form-item :label="t('NotifyOnSuccess')" label-width="350px">
      <el-switch v-model="config.notifyOnSuccess"></el-switch>
    </el-form-item>
    <el-form-item :label="t('QuickAddInContextMenu')" label-width="350px">
      <el-switch v-model="config.quickAddTaskInContextMenu"></el-switch>
    </el-form-item>
    <el-form-item :label="t('SaveDebugInfo')" label-width="350px">
      <el-switch v-model="config.saveDebugInfo"></el-switch>
    </el-form-item>

    <el-form-item class="buttons" :label="t('ShowButtons')">
      <el-checkbox-group size="small" v-model="config.showButtons">
        <el-checkbox-button label="settings" :title="t('Settings')">
          <i class="el-icon-setting"></i>
        </el-checkbox-button>
        <el-checkbox-button label="review" :title="t('RateExtension')">
          <i class="el-icon-medal-1"></i>
        </el-checkbox-button>
        <el-checkbox-button label="issue" :title="t('ReportBug')">
          <i class="el-icon-warning-outline"></i>
        </el-checkbox-button>
        <el-checkbox-button label="logout" :title="t('Logout')">
          <i class="el-icon-switch-button"></i>
        </el-checkbox-button>
      </el-checkbox-group>
    </el-form-item>
    <div class="made-with-love">
      <a
        href="https://github.com/ukhan/add-to-ms-todo/blob/master/CHANGELOG.md"
        target="_blank"
        >v {{ version }}</a
      >
      • Made with <span class="love">❤</span> in
      <a href="https://madewithlove.in.ua" target="_blank">
        <img
          class="Ukraine"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAuSURBVDhPYxgGQHHa5ygg/k8mjho1AGjAn+umUX9vmP4nB4P0jhoANGCoAwYGABPEurh8awULAAAAAElFTkSuQmCC"
        />
      </a>
      Ukraine by <a href="mailto:pavel.ukhan@gmail.com">Pavel Ukhan</a>
    </div>
  </el-form>
</template>

<style>
.account-info {
  padding-left: 10px;
  font-size: 14px;
  color: #606266;
}
.options-form {
  width: 480px;
  margin-left: 25px;
}
.el-form-item__content,
.el-form-item__label {
  line-height: 20px;
}
.el-form-item {
  margin-bottom: 10px;
}
.col1 {
  width: 110px;
  padding-left: 10px;
}
/* .reminder-interval-picker {
  width: 130px !important;
} */
.reminder-time-step.en label,
.default-reminder-time.en label,
.default-list label {
  padding-top: 8px;
}
.reminder-time-step .el-select {
  width: 140px;
  padding-left: 10px;
}
.default-reminder-time .el-select,
.default-reminder-time .el-date-editor,
.default-reminder-time .el-input__inner {
  width: 140px;
}
.reminder-time-step.no-en .el-select {
  padding-top: 4px;
}
.default-list .el-select,
.default-reminder-time .el-form-item__content {
  padding-left: 10px;
}
.default-reminder-time .el-switch {
  margin-left: 16px;
}
.buttons {
  margin-top: 20px;
}
.buttons .el-checkbox-group {
  margin-left: 10px;
}
.buttons .el-form-item__label {
  margin-top: -4px;
}
.made-with-love {
  text-align: center;
  font-size: 0.6rem;
  color: #909399;
  margin-top: 18px;
  margin-bottom: 14px;
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
import {
  CheckAuthMethod,
  isAuthenticated,
  login,
  me,
  logout,
} from '@/helpers/auth';
import { set as setConfig } from '@/helpers/config';
import { t, currentLocale } from '@/helpers/i18n';
import { padZero, formatTime } from '@/helpers/utils';
import { getFolders } from '@/helpers/task';
import TimePicker from '@/components/TimePicker';

const p = require('../../../package.json');

export default {
  name: 'OptionsUI',

  data() {
    return {
      isAuthenticated: undefined,
      profile: {},
      lists: [],
      disabledLists: '',
      version: p.version,
    };
  },

  async created() {
    this.isAuthenticated = await isAuthenticated(CheckAuthMethod.FAST);
    if (this.isAuthenticated) {
      this.profile = await me();
      this.loadLists();
    }
  },

  computed: {
    config() {
      return 'showButtons' in this.$root.config
        ? this.$root.config
        : { showButtons: [] };
    },
    enTranslate() {
      return !(currentLocale === 'uk' || currentLocale === 'ru');
    },
  },

  watch: {
    config: {
      handler(config) {
        setConfig(config);
      },
      deep: true,
    },
  },

  methods: {
    getDateFormatLabel(format) {
      let date = new Date(),
        d = this.padZero(date.getDate()),
        m = this.padZero(date.getMonth() + 1),
        y = date.getFullYear();

      if (format === 'MM/dd/yyyy') {
        return `${m}/${d}/${y}`;
      } else if (format === 'dd.MM.yyyy') {
        return `${d}.${m}.${y}`;
      } else {
        return format;
      }
    },

    getTimeFormatLabel(format) {
      return this.formatTime(format);
    },

    async signIn() {
      this.profile = await login();
      this.isAuthenticated = this.profile && this.profile.name !== '';
      if (this.isAuthenticated) {
        this.loadLists();
      }
    },

    async signOut() {
      await logout();
      this.isAuthenticated = false;
      this.profile = {};
      this.lists = [];
    },

    async loadLists() {
      chrome.storage.local.get(['folders'], async (res) => {
        this.lists = res.folders || [];
        let folders = await getFolders();
        if (folders.length) {
          this.lists = folders;
        }
      });
    },

    t,
    padZero,
    formatTime,
  },

  components: { TimePicker },
};
</script>
