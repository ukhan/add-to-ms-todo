<template>
  <div class="m-2">
    <div v-if="isAuthenticated === undefined">
      Loading...
    </div>
    <div v-else-if="isAuthenticated" class="cursor-pointer" @click="recheck">
      Authenticated
    </div>
    <div v-else>
      <div class="cursor-pointer" @click="login">
        Login
      </div>
    </div>
  </div>
</template>

<script>
import { isAuthenticated, auth } from '@/helpers/auth';

export default {
  name: 'UI',
  data() {
    return {
      isAuthenticated: undefined
    };
  },
  async created() {
    this.isAuthenticated = await isAuthenticated();
  },
  methods: {
    async login() {
      await auth();
      this.isAuthenticated = await isAuthenticated();
    },
    async recheck() {
      this.isAuthenticated = await isAuthenticated();
    }
  }
};
</script>
