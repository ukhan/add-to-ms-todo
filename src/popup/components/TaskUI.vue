<template>
  <el-form label-position="top" size="small" class="add-task-form">
    <TextareaFormItem
      :label="t('Title')"
      :rows="2"
      v-model="task.title"
      autofocus="true"
      @enter-pressed="save"
    />

    <TextareaFormItem
      :label="t('Description')"
      :rows="4"
      v-model="task.description"
    />

    <el-row :gutter="8">
      <el-col :span="22">
        <el-form-item :label="t('List')">
          <el-select v-model="lst" :placeholder="lstPlaceholder" filterable>
            <el-option
              v-for="l in lists"
              :key="l.id"
              :label="l.label"
              :value="l.id"
            >
            </el-option>
            <el-option
              key="0"
              :label="t('Tasks')"
              :value="null"
              v-if="!lists.length"
            ></el-option>
            <el-option
              key="-1"
              :label="t('FailedLoadTaskLists')"
              value="lists_not_loaded"
              :disabled="true"
              v-if="!lists.length"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="2">
        <i
          :title="t('Importance')"
          @click="task.importance = !task.importance"
          class="importance-button"
          :class="{
            'el-icon-star-off': !task.importance,
            'el-icon-star-on': task.importance,
          }"
        ></i>
      </el-col>
    </el-row>

    <ReminderFormItem
      v-model="task.reminderDateTime"
      v-if="config.showReminderDate"
    />

    <DueFormItem v-model="task.dueDate" v-if="config.showDueDate" />

    <el-row :gutter="8">
      <el-col :span="15">
        <ServiceButtons
          :config="config"
          :profile="profile"
          @logout="$emit('logout')"
          @toggle="toggleForm($event)"
        />
      </el-col>
      <el-col :span="9">
        <el-button
          class="submit-button"
          type="primary"
          size="medium"
          :disabled="submitDisabled"
          :loading="inProcess"
          @click="save"
        >
          {{ submitTitle }}
        </el-button>
      </el-col>
    </el-row>
  </el-form>
</template>

<style>
.add-task-form {
  width: 400px;
}
.el-form-item--small.el-form-item {
  margin-bottom: 8px;
}
.el-textarea__inner {
  font-family: inherit;
  padding: 20px 10px 5px;
  scroll-behavior: smooth;
}
.el-date-editor.el-input,
.el-select--small,
.submit-button {
  width: 100%;
}
.el-date-editor--date .el-input__inner,
.el-date-editor--time-select .el-input__inner,
.el-select--small .el-input__inner {
  height: 3.8em;
  padding-top: 12px;
}
.el-select-dropdown {
  left: 8px !important;
  max-width: 400px !important;
}
.el-select--small .el-input__inner {
  padding-left: 10px;
}
.el-input__prefix,
.el-input__suffix {
  top: 8px;
}
.el-form-item--small .el-form-item__label {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  line-height: 2em;
  font-size: 0.8em;
  margin-left: 11px;
  color: #909399;
}
.el-textarea.el-input--small:before {
  content: '';
  display: block;
  height: 19px;
  position: absolute;
  top: 1px;
  left: 4px;
  right: 18px;
}
.el-textarea.el-input--small:after {
  content: '';
  display: block;
  height: 4px;
  position: absolute;
  bottom: 1px;
  left: 4px;
  right: 18px;
}
.importance-button {
  font-size: 1.4rem;
  padding-top: 0.8rem;
  color: #909399;
  cursor: pointer;
}
.importance-button.el-icon-star-on {
  font-size: 1.7rem;
  padding-top: 0.6rem;
  margin-left: -0.2rem;
}
</style>

<script>
const debounce = require('lodash.debounce');

import { logout } from '@/helpers/auth';
import { addTask } from '@/helpers/task';
import { t } from '@/helpers/i18n';
import { notification, closeNotification } from '@/helpers/notification';
import getTabInfo from '@/helpers/tab';
import { set as setConfig } from '@/helpers/config';
import { preSave, preLoad, preDelete } from '@/helpers/presave';

import TextareaFormItem from './TextareaFormItem';
import ReminderFormItem from './ReminderFormItem';
import DueFormItem from './DueFormItem';
import ServiceButtons from './ServiceButtons';

export default {
  name: 'TaskUI',

  props: {
    profile: {
      type: Object,
      required: true,
    },
    lists: {
      type: Array,
      required: true,
    },
    listsLoaded: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {
      task: {
        title: '',
        description: '',
        list: '',
        reminderDateTime: '',
        dueDate: '',
        importance: false,
      },
      tabInfo: {},
      inProcess: false,
      config: this.$root.config,
    };
  },

  computed: {
    submitDisabled() {
      return !this.task.title.trim().length || !this.listsLoaded;
    },

    submitTitle() {
      return this.listsLoaded ? this.t('SaveTask') : this.t('Wait');
    },

    lst: {
      get() {
        if (!this.lists.length) return null;

        if (this.task.list == '') {
          let lists_ids = this.lists.map((list) => list.id);
          if (lists_ids.indexOf(this.config.listDefault) === -1) {
            let defaultList = this.lists.filter((list) => list.isDefault);
            this.config.listDefault = defaultList[0].id;
            this.task.list = defaultList[0].id;
          } else {
            this.task.list = this.config.listDefault;
          }
        }

        return this.task.list;
      },

      set(list) {
        this.task.list = list;
      },
    },

    lstPlaceholder() {
      if (this || this.lists === []) {
        return this.t('Loading');
      } else {
        return '';
      }
    },
  },

  watch: {
    config: {
      handler(config) {
        setConfig(config);
      },
      deep: true,
    },

    task: {
      handler(task) {
        this.debouncedHandleTaskChanges(task);
      },
      deep: true,
    },
  },

  created() {
    this.debouncedHandleTaskChanges = debounce(this.handleTaskChanges, 500);
    getTabInfo()
      .then(this.preLoad)
      .then((data) => {
        this.tabInfo = data.tabInfo;
        if (data.task) {
          this.task = data.task;
        } else {
          if (this.config.preFill) {
            this.task.title = this.tabInfo.title;
            this.task.description = this.getTaskDescription();
          }
        }
      });
  },

  methods: {
    async logout() {
      await logout();
      this.$emit('logout');
    },

    handleTaskChanges(task) {
      this.preSave(task, this.tabInfo);
    },

    save() {
      let task = {
        title: this.task.title,
        description: this.task.description,
        reminder: this.task.reminderDateTime,
        due: this.task.dueDate,
        importance: this.task.importance,
      };
      if (this.task.list) {
        task['list'] = this.task.list;
        if (this.config.useLastUsedList) {
          this.config.listDefault = this.task.list;
        }
      }
      this.inProcess = true;
      if (this.config.useLastUsedTime && this.reminderDateTime) {
        let [d, t] = this.reminderDateTime.split('T');
        this.config.timeDefault = t.split(':').splice(0, 2).join(':');
      }
      addTask(task)
        .then((response) => {
          this.preDelete(this.tabInfo.id);
          this.inProcess = false;
          if (this.config.notifyOnSuccess) {
            notification(this.t('SuccessNotification'), false, () => {
              window.close();
            }).then((id) => {
              chrome.runtime.sendMessage({ action: 'CLOSE_NOTIFICATION', id });
            });
          } else {
            window.close();
          }
        })
        .catch((res) => {
          let err = this.t('ErrorNotification');
          if (res.statusText || res.status) {
            err = err + '\n' + (res.statusText || `#${res.status}`);
          }
          this.inProcess = false;
          notification(err);
        });
    },

    getTaskDescription() {
      return this.tabInfo.selected.trim().length
        ? `${this.tabInfo.selected}\n\n${this.tabInfo.url}`
        : this.tabInfo.url;
    },

    toggleForm(whatToDo) {
      if (whatToDo === 'clear') {
        this.clearTaskInfo();
      } else {
        this.fillTaskInfo();
      }
    },

    clearTaskInfo() {
      this.task.title = '';
      this.task.description = '';
    },

    fillTaskInfo() {
      this.task.title = this.tabInfo.title;
      this.task.description = this.getTaskDescription();
    },

    t,
    preSave,
    preLoad,
    preDelete,
  },

  components: {
    TextareaFormItem,
    ReminderFormItem,
    DueFormItem,
    ServiceButtons,
  },
};
</script>
