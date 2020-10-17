<template>
  <div>
    <LoadingUI v-if="isAuthenticated === undefined" />
    <TaskUI
      v-else-if="isAuthenticated"
      :profile="profile"
      :lists="lists"
      :listsLoaded="listsLoaded"
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
  logout,
} from '@/helpers/auth';
import storage from '@/helpers/storage';
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
      lists: [],
      listsLoaded: false,
    };
  },

  async created() {
    this.isAuthenticated = await isAuthenticated(CheckAuthMethod.FAST);
    if (this.isAuthenticated) {
      this.loadProfile();
      this.loadFolders();
    }
  },

  methods: {
    handleLogin(profile) {
      this.profile = profile;
      this.isAuthenticated = profile && profile.name !== '';
      if (this.isAuthenticated) this.loadFolders();
    },

    async loadProfile() {
      this.profile = await me();
    },

    async loadFolders() {
      storage.local.get(['folders'], async (res) => {
        this.lists = res.folders || [];
        let folders = await getFolders();
        if (folders.length) {
          this.lists = folders;
        }
        this.listsLoaded = true;
      });
    },

    handleLogout() {
      this.isAuthenticated = '';
    },
  },

  components: {
    LoadingUI,
    LoginUI,
    TaskUI,
  },
};
</script>
