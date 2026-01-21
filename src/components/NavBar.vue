<template>
  <nav class="sidebar">
    <div class="sidebar-brand">
      <span class="sidebar-logo">🔄</span>
      <span class="sidebar-title">New-API<br/>重定向工具</span>
    </div>
    <div class="sidebar-menu">
      <router-link to="/settings" class="sidebar-item" active-class="active">
        <span class="sidebar-icon">⚙️</span>
        <span>设置</span>
      </router-link>
      <router-link to="/redirect-map" class="sidebar-item" active-class="active">
        <span class="sidebar-icon">🔀</span>
        <span>映射配置</span>
      </router-link>
      <router-link to="/sync" class="sidebar-item" active-class="active">
        <span class="sidebar-icon">📤</span>
        <span>同步</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 200px;
  min-width: 200px;
  height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  box-shadow: 2px 0 12px rgba(102, 126, 234, 0.3);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.sidebar-logo {
  font-size: 28px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 12px;
  flex: 1;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.sidebar-icon {
  font-size: 18px;
}
</style>
