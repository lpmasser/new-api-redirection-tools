<template>
  <div class="app">
    <!-- 登录页面不显示导航栏 -->
    <template v-if="!isLoginPage">
      <NavBar />
    </template>
    <main :class="['main-content', { 'full-page': isLoginPage }]">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { useAuthStore } from './stores/auth'
import { useMappingStore } from './stores/mapping'

const route = useRoute()
const authStore = useAuthStore()
const mappingStore = useMappingStore()

// 判断是否是登录页面
const isLoginPage = computed(() => route.name === 'login')

// 登录后加载数据
onMounted(async () => {
  if (authStore.isLoggedIn && !mappingStore.loaded) {
    try {
      await mappingStore.loadFromServer()
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }
})
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.main-content.full-page {
  width: 100%;
}
</style>
