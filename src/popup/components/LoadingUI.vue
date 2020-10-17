<template>
  <div id="loading">
    <el-row type="flex" justify="center">
      <div>
        <img :src="getUrl('assets/logo-150.png')" id="logo" />
      </div>
    </el-row>
    <el-row type="flex" justify="center">
      <i class="el-icon-loading" :title="t('Loading')"></i>
    </el-row>
  </div>
</template>

<style scoped>
#loading {
  padding-bottom: 20px;
}
#logo {
  padding: 20px;
  width: 100px;
}
.el-icon-loading {
  font-size: 1.4rem;
}
</style>

<script>
import { getUrl } from '@/helpers/runtime';
import { t } from '@/helpers/i18n';

export default {
  name: 'LoadingUI',
  methods: {
    getUrl,
    t,
  },
};
</script>
