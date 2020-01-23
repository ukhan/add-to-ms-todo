<template>
  <div id="login">
    <el-row type="flex" justify="center">
      <div>
        <img :src="getUrl('assets/logo-150.png')" id="logo" />
      </div>
    </el-row>
    <el-row type="flex" justify="center">
      <el-button type="primary" :loading="inProgress" @click="auth">
        {{ t('GetStarted') }}
      </el-button>
    </el-row>
  </div>
</template>

<style scoped>
#login {
  padding-bottom: 20px;
}
#logo {
  padding: 20px;
}
</style>

<script>
import { login } from '@/helpers/auth';
import { getUrl } from '@/helpers/runtime';
import { t } from '@/helpers/i18n';

export default {
  name: 'LoginUI',

  data() {
    return {
      inProgress: false
    };
  },

  methods: {
    async auth() {
      this.inProgress = true;
      const profile = await login();
      this.inProgress = false;
      this.$emit('login', profile);
    },
    getUrl,
    t
  }
};
</script>
