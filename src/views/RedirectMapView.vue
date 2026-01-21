<template>
  <div class="redirect-map-view">
    <!-- 映射规则表格 -->
    <MappingTable />
    
    <!-- 渠道列表 -->
    <div class="channel-section">
      <div class="section-header">
        <h3 class="section-title">渠道列表</h3>
        <div class="section-actions">
          <button class="btn-action" @click="loadChannels" :disabled="channelStore.loading">
            {{ channelStore.loading ? '加载中...' : '🔄 刷新渠道' }}
          </button>
          <button class="btn-action" @click="loadAllModels" :disabled="loadingAllModels">
            {{ loadingAllModels ? '加载中...' : '📥 获取所有上游模型' }}
          </button>
        </div>
      </div>
      
      <div class="error-message" v-if="channelStore.error">
        {{ channelStore.error }}
      </div>
      
      <div class="channel-list" v-if="channelStore.channels.length > 0">
        <ChannelCard 
          v-for="channel in channelStore.channels" 
          :key="channel.id"
          :channel="channel"
        />
      </div>
      
      <div class="empty-state" v-else-if="!channelStore.loading">
        <p>暂无渠道数据</p>
        <p class="empty-hint">请先在设置页面配置 API 信息，然后点击「刷新渠道」</p>
      </div>
      
      <div class="loading-state" v-if="channelStore.loading">
        <div class="spinner"></div>
        <p>正在加载渠道列表...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChannelStore } from '../stores/channel'
import { useConfigStore } from '../stores/config'
import ChannelCard from '../components/ChannelCard.vue'
import MappingTable from '../components/MappingTable.vue'

const channelStore = useChannelStore()
const configStore = useConfigStore()

const loadingAllModels = ref(false)

// 加载渠道列表
async function loadChannels() {
  if (!configStore.isConfigValid()) {
    alert('请先在设置页面配置 API 信息')
    return
  }
  
  try {
    await channelStore.loadChannels()
  } catch (e) {
    console.error('加载渠道失败:', e)
  }
}

// 加载所有渠道的上游模型
async function loadAllModels() {
  if (channelStore.channels.length === 0) {
    alert('请先加载渠道列表')
    return
  }
  
  loadingAllModels.value = true
  try {
    await channelStore.loadAllUpstreamModels()
  } finally {
    loadingAllModels.value = false
  }
}

// 页面加载时自动刷新
onMounted(() => {
  if (configStore.isConfigValid() && channelStore.channels.length === 0) {
    loadChannels()
  }
})
</script>

<style scoped>
.redirect-map-view {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.channel-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  padding: 8px 16px;
  font-size: 13px;
  color: #333;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  font-size: 14px;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state,
.loading-state {
  padding: 48px 20px;
  text-align: center;
  color: #888;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-hint {
  font-size: 13px;
  color: #aaa;
  margin-top: 8px;
}

.spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto 16px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
