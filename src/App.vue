<template>
  <div class="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
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
</style>
