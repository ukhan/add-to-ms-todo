<template>
  <div>
    <el-row :gutter="8">
      <el-col :span="15">
        <el-form-item :label="_('ReminderDate')">
          <el-date-picker
            v-model="remindDate"
            type="date"
            :format="config.dateFormat"
            :picker-options="datePickerOptions"
          >
          </el-date-picker>
        </el-form-item>
      </el-col>
      <el-col :span="9">
        <el-form-item :label="_('ReminderTime')">
          <el-time-select
            v-model="remindTime"
            :clearable="false"
            :picker-options="timePickerOptions"
          ></el-time-select>
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { currentLocale, t as _ } from '@/helpers/i18n';

export default {
  name: 'ReminderFormItem',

  props: {
    value: String // 2016-05-03T09:00:00
  },

  data() {
    let config = this.$root.config;

    return {
      d: null,
      t: null,
      datePickerOptions: {
        firstDayOfWeek: config.firstDayOfWeek
      },
      timePickerOptions: {
        start: config.timeStart,
        end: config.timeEnd,
        step: config.timeStep
      },
      config
    };
  },

  computed: {
    remindDate: {
      get() {
        this.d = this.value || '';
        return this.d;
      },
      set(date) {
        this.d = date;
        if (date) {
          if (!this.t) {
            this.t = this.config.timeDefault;
          }
        } else {
          this.t = null;
        }

        this.$emit('input', this.reminderISOString);
      }
    },

    remindTime: {
      get() {
        if (this.value) {
          let dt = new Date(this.value),
            hours = this.padZero(dt.getHours()),
            minutes = this.padZero(dt.getMinutes());

          return `${hours}:${minutes}`;
        } else {
          return '';
        }
      },
      set(time) {
        this.t = time;
        if (time && !this.d) {
          let current = new Date();
          if (this.timeLessCurrent(time)) {
            current.setDate(current.getDate() + 1);
          }
          this.d = this.getISODate(current);
        }

        this.$emit('input', this.reminderISOString);
      }
    },

    reminderISOString() {
      if (!this.d) return null;

      let dt = new Date(this.d),
        day = this.padZero(dt.getDate()),
        month = this.padZero(dt.getMonth() + 1),
        year = dt.getFullYear(),
        [hours, minutes] = this.t.split(':');

      hours = this.padZero(hours);
      minutes = this.padZero(minutes);

      return `${year}-${month}-${day}T${hours}:${minutes}:00`;
    }
  },

  methods: {
    getISODate(date = new Date()) {
      let dt = new Date(date),
        day = this.padZero(dt.getDate()),
        month = this.padZero(dt.getMonth() + 1),
        year = dt.getFullYear();

      return `${year}-${month}-${day}`;
    },

    padZero(v, len = 2) {
      return v.toString().padStart(len, '0');
    },

    timeLessCurrent(time) {
      if (!time) return true;

      let current = new Date(),
        timed = new Date(),
        [hours, minutes] = time.split(':');

      timed.setHours(hours);
      timed.setMinutes(minutes);

      return timed < current;
    },

    _
  }
};
</script>
