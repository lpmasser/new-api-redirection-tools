<template>
  <div class="redirect-map-view">
    <!-- 左侧：渠道列表 -->
    <div class="left-panel">
      <div class="panel-header">
        <h3 class="panel-title">渠道列表</h3>
        <div class="panel-actions">
          <button class="btn-action" @click="loadChannels" :disabled="channelStore.loading">
            {{ channelStore.loading ? '...' : '🔄' }}
          </button>
          <button class="btn-action" @click="loadAllModels" :disabled="loadingAllModels" title="获取所有上游模型">
            {{ loadingAllModels ? '...' : '📥' }}
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
        <p class="empty-hint">请先配置 API，然后点击刷新</p>
      </div>
      
      <div class="loading-state" v-if="channelStore.loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </div>
    
    <!-- 右侧：映射规则 -->
    <div class="right-panel">
      <MappingTable />
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

onMounted(() => {
  if (configStore.isConfigValid() && channelStore.channels.length === 0) {
    loadChannels()
  }
})
</script>

<style scoped>
.redirect-map-view {
  display: flex;
  height: 100%;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.left-panel {
  flex: 6;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
}

.right-panel {
  flex: 4;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  background: #f5f7fa;
  padding-top: 4px;
  z-index: 10;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.panel-actions {
  display: flex;
  gap: 6px;
}

.btn-action {
  width: 32px;
  height: 32px;
  font-size: 14px;
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
  padding: 10px 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state,
.loading-state {
  padding: 40px 20px;
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
  width: 24px;
  height: 24px;
  margin: 0 auto 12px;
  border: 2px solid #f0f0f0;
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
