<template>
  <div>
    <el-form-item :label="_('DueDate')">
      <el-date-picker
        v-model="dueDate"
        type="date"
        :format="dateFormat"
        value-format="yyyy-MM-dd"
        :picker-options="datePickerOptions"
      >
      </el-date-picker>
    </el-form-item>
  </div>
</template>

<script>
import { t as _ } from '@/helpers/i18n';

export default {
  name: 'DueFormItem',

  props: {
    value: String // 2020-04-25
  },

  data() {
    let config = this.$root.config;

    return {
      d: null,
      datePickerOptions: {
        firstDayOfWeek: config.firstDayOfWeek
      },
      dateFormat: config.dateFormat
    };
  },

  computed: {
    dueDate: {
      get() {
        this.d = this.value || '';
        return this.d;
      },
      set(date) {
        this.d = date;
        this.$emit('input', date);
      }
    }
  },

  methods: {
    _
  }
};
</script>
