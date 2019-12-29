<template>
  <div class="m-2">
    <div v-if="isAuthenticated === undefined">
      Loading...
    </div>
    <div v-else-if="isAuthenticated">
      Authenticated {{ name }} {{ email }}:
      <a href="#" @click="recheck">Recheck</a>
      <a href="#" @click="logout">Logout</a>
    </div>
    <div v-else>
      <div class="cursor-pointer" @click="login">
        Login
      </div>
    </div>
  </div>
</template>

<script>
import { isAuthenticated, login, me, logout } from '@/helpers/auth';

export default {
  name: 'UI',
  data() {
    return {
      isAuthenticated: undefined,
      name: '',
      email: ''
    };
  },
  async created() {
    this.isAuthenticated = await isAuthenticated();
    this.loadProfile();
  },
  methods: {
    async login() {
      const profile = await login();

      this.isAuthenticated = profile.name !== '';
      this.name = profile.name;
      this.email = profile.email;
    },
    async loadProfile() {
      if (this.isAuthenticated) {
        const profile = await me();

        this.name = profile.name;
        this.email = profile.email;
      }
    },
    async recheck() {
      this.isAuthenticated = await isAuthenticated();
      this.loadProfile();
    },
    logout() {
      logout();
      this.isAuthenticated = '';
      this.name = '';
      this.email = '';
    }
  }
};
</script>
