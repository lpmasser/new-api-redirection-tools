<template>
  <div class="settings-view">
    <div class="settings-card">
      <h2 class="settings-title">API 配置</h2>
      <p class="settings-desc">配置 New-API 服务的连接信息</p>
      
      <form class="settings-form" @submit.prevent="saveConfig">
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🌐</span>
            基础地址 (Base URL)
          </label>
          <input 
            v-model="baseUrl" 
            type="url" 
            class="form-input"
            placeholder="https://your-new-api-server.com"
            required
          />
          <span class="form-hint">New-API 服务的完整地址</span>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🔑</span>
            访问令牌 (Token)
          </label>
          <input 
            v-model="token" 
            type="password" 
            class="form-input"
            placeholder="输入你的 Access Token"
            required
          />
          <span class="form-hint">用于 API 认证的 Bearer Token</span>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">👤</span>
            用户 ID
          </label>
          <input 
            v-model="userId" 
            type="text" 
            class="form-input"
            placeholder="输入你的用户 ID"
            required
          />
          <span class="form-hint">New-API 的用户标识</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            <span>💾</span>
            保存配置
          </button>
          <button type="button" class="btn btn-secondary" @click="testConnection">
            <span>🔍</span>
            测试连接
          </button>
        </div>
      </form>

      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { getChannels } from '../api/channel'

const configStore = useConfigStore()

const baseUrl = ref('')
const token = ref('')
const userId = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// 加载已保存的配置
onMounted(() => {
  baseUrl.value = configStore.baseUrl
  token.value = configStore.token
  userId.value = configStore.userId
})

// 保存配置
function saveConfig() {
  configStore.updateConfig(baseUrl.value, token.value, userId.value)
  showMessage('配置已保存', 'success')
}

// 测试连接
async function testConnection() {
  // 先保存配置
  configStore.updateConfig(baseUrl.value, token.value, userId.value)
  
  try {
    const channels = await getChannels()
    showMessage(`连接成功！获取到 ${channels.length} 个渠道`, 'success')
  } catch (e) {
    showMessage(`连接失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
  }
}

function showMessage(msg: string, type: 'success' | 'error') {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}
</script>

<style scoped>
.settings-view {
  padding: 40px;
  display: flex;
  justify-content: center;
}

.settings-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.settings-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.settings-desc {
  margin: 0 0 24px;
  color: #666;
  font-size: 14px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.label-icon {
  font-size: 16px;
}

.form-input {
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.form-input::placeholder {
  color: #aaa;
}

.form-hint {
  font-size: 12px;
  color: #888;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #eee;
}

.message {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}
</style>
