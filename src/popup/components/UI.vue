<template>
  <div>
    <LoadingUI v-if="isAuthenticated === undefined" />
    <TaskUI
      v-else-if="isAuthenticated"
      :profile="profile"
      :lists="lists"
      @logout="handleLogout"
    />
    <LoginUI v-else @login="handleLogin" />
  </div>
</template>

<script>
import {
  CheckAuthMethod,
  isAuthenticated,
  login,
  me,
  logout
} from '@/helpers/auth';
import { getFolders } from '@/helpers/task';
import LoadingUI from './LoadingUI';
import LoginUI from './LoginUI';
import TaskUI from './TaskUI';

export default {
  name: 'UI',

  data() {
    return {
      isAuthenticated: undefined,
      profile: {},
      lists: []
    };
  },

  async created() {
    this.isAuthenticated = await isAuthenticated(CheckAuthMethod.FAST);
    if (this.isAuthenticated) {
      this.loadProfile();
      chrome.storage.local.get(['folders'], async res => {
        this.lists = res.folders || [];
        let folders = await getFolders();
        if (folders.length) {
          this.lists = folders;
        }
      });
    }
  },

  methods: {
    handleLogin(profile) {
      this.profile = profile;
      this.isAuthenticated = profile && profile.name !== '';
    },

    async loadProfile() {
      this.profile = await me();
    },

    handleLogout() {
      this.isAuthenticated = '';
    }
  },

  components: {
    LoadingUI,
    LoginUI,
    TaskUI
  }
};
</script>
