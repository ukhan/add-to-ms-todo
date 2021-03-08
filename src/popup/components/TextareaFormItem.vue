<template>
  <el-form-item :label="label">
    <el-input
      ref="ta"
      type="textarea"
      resize="none"
      :rows="rows"
      v-model="v"
      :autofocus="autofocus"
    >
    </el-input>
  </el-form-item>
</template>

<script>
export default {
  name: 'TextareaFormItem',

  props: {
    label: String,
    rows: Number,
    value: String,
    autofocus: String,
  },

  data() {
    return {
      ta: undefined,
      prevScrollTop: 0,
      prevCaretRow: 1,
      lineHeight: undefined,
    };
  },

  computed: {
    v: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },

    rowsCount() {
      return this.v.split('\n').length;
    },

    rowsOverflow() {
      return this.rowsCount > this.rows;
    },
  },

  methods: {
    currentRow() {
      return this.ta.value.substr(0, this.ta.selectionStart).split('\n').length;
    },

    handleKeyup(e) {
      if (!this.rowsOverflow) return;

      let currentScrollTop = this.ta.scrollTop;
      let newScrollTop = currentScrollTop;
      let currentCaretRow = this.currentRow();

      if (this.prevScrollTop < currentScrollTop) {
        newScrollTop =
          currentScrollTop +
          this.lineHeight -
          (currentScrollTop % this.lineHeight);
        this.setScrollTop(newScrollTop);
      }

      if (
        currentCaretRow < this.prevCaretRow &&
        newScrollTop >= currentCaretRow * this.lineHeight
      ) {
        newScrollTop = newScrollTop - this.lineHeight;
        this.setScrollTop(newScrollTop);
      }

      this.prevCaretRow = currentCaretRow;
      this.prevScrollTop = newScrollTop;
    },

    handleMouseup() {
      this.prevCaretRow = this.currentRow();
    },

    setScrollTop(pos) {
      this.$nextTick(() => {
        this.ta.scrollTop = pos;
      });
    },
  },

  mounted() {
    this.ta = this.$refs.ta.$refs.textarea;
    this.lineHeight = parseInt(
      getComputedStyle(this.ta).getPropertyValue('line-height')
    );

    this.ta.addEventListener('keyup', this.handleKeyup);
    this.ta.addEventListener('mouseup', this.handleKeyup);
  },

  beforeDestroy() {
    this.ta.removeEventListener('keyup', this.handleKeyup);
    this.ta.removeEventListener('mouseup', this.handleKeyup);
  },
};
</script>
