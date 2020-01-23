<template>
  <el-time-select
    v-if="format === '24h'"
    v-model="current"
    :clearable="false"
    :picker-options="picker24hOptions"
  >
  </el-time-select>

  <el-select v-else class="time-12" v-model="current" placeholder="">
    <el-option
      v-for="item in options12h"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
    </el-option>
    <template slot="prefix"><i class="el-icon-time"></i></template>
  </el-select>
</template>

<style>
.time-12 .el-input__prefix {
  padding-top: 9px;
  padding-left: 4px;
}
.time-12 .el-input__inner {
  padding-left: 30px !important;
}
</style>

<script>
import { padZero, formatTime } from '@/helpers/utils';

export default {
  name: 'TimePicker',

  props: {
    value: {
      type: String,
      default: ''
    },
    format: {
      type: String,
      default: '24h'
    },
    start: {
      type: String,
      default: '00:00'
    },
    end: {
      type: String,
      default: '23:59'
    },
    step: {
      type: String,
      default: '01:00'
    }
  },

  data() {
    return {
      picker24hOptions: {
        start: this.start,
        step: this.step,
        end: this.end
      }
    };
  },

  methods: {
    t2m(t) {
      let [h, m] = t.split(':').map(v => parseInt(v));
      return h * 60 + m;
    },

    m2t(v, format = '24h') {
      let h = this.padZero(Math.floor(v / 60)),
        m = this.padZero(v - h * 60),
        time24 = `${h}:${m}`;

      return format == '24h' ? time24 : this.formatTime('12h', time24);
    },

    padZero,
    formatTime
  },

  computed: {
    current: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    },

    options12h() {
      let start = this.t2m(this.start),
        end = this.t2m(this.end),
        step = this.t2m(this.step),
        options = [];

      for (let m = start; m <= end; m = m + step) {
        let option = {
          value: this.m2t(m),
          label: this.m2t(m, '12h')
        };
        options.push(option);
      }

      return options;
    }
  }
};
</script>
