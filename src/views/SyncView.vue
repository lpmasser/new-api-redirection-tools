<template>
  <div class="sync-view">
    <!-- 左侧：渠道同步配置列表 -->
    <div class="left-panel">
      <ChannelSyncList />
    </div>
    
    <!-- 右侧：同步控制 -->
    <div class="right-panel">
      <div class="sync-card">
        <h2 class="sync-title">同步配置到 New-API</h2>
        <p class="sync-desc">将映射规则同步到各个渠道</p>
        
        <!-- 同步模式选择 -->
        <div class="mode-section">
          <h3 class="mode-title">同步模式</h3>
          <div class="mode-options">
            <label class="mode-option" :class="{ active: mappingStore.syncMode === 'append' }">
              <input 
                type="radio" 
                value="append" 
                v-model="mappingStore.syncMode"
              />
              <div class="mode-content">
                <span class="mode-icon">➕</span>
                <span class="mode-name">追加模式</span>
                <span class="mode-desc">保留原有配置，追加新规则</span>
              </div>
            </label>
            <label class="mode-option" :class="{ active: mappingStore.syncMode === 'overwrite' }">
              <input 
                type="radio" 
                value="overwrite" 
                v-model="mappingStore.syncMode"
              />
              <div class="mode-content">
                <span class="mode-icon">🔄</span>
                <span class="mode-name">覆盖模式</span>
                <span class="mode-desc">完全替换渠道的模型配置</span>
              </div>
            </label>
          </div>
        </div>
        
        <!-- 同步预览 -->
        <div class="preview-section">
          <h3 class="preview-title">同步预览</h3>
          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-value">{{ mappingStore.ruleCount }}</span>
              <span class="stat-label">映射规则</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ channelStore.channels.length }}</span>
              <span class="stat-label">目标渠道</span>
            </div>
          </div>
        </div>
        
        <!-- 同步按钮 -->
        <div class="sync-actions">
          <button 
            class="btn-sync" 
            @click="startSync"
            :disabled="syncing || mappingStore.ruleCount === 0"
          >
            <span v-if="syncing">同步中...</span>
            <span v-else>📤 开始同步</span>
          </button>
        </div>
        
        <!-- 同步日志 -->
        <div class="sync-log" v-if="logs.length > 0">
          <h3 class="log-title">同步日志</h3>
          <div class="log-list">
            <div 
              v-for="(log, index) in logs" 
              :key="index"
              class="log-item"
              :class="log.type"
            >
              <span class="log-icon">{{ log.type === 'success' ? '✅' : log.type === 'error' ? '❌' : 'ℹ️' }}</span>
              <span class="log-text">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChannelStore } from '../stores/channel'
import { useMappingStore } from '../stores/mapping'
import { useConfigStore } from '../stores/config'
import { updateChannel } from '../api/channel'
import ChannelSyncList from '../components/ChannelSyncList.vue'

const channelStore = useChannelStore()
const mappingStore = useMappingStore()
const configStore = useConfigStore()

const syncing = ref(false)
const logs = ref<{ type: 'info' | 'success' | 'error'; message: string }[]>([])

// 添加日志
function addLog(type: 'info' | 'success' | 'error', message: string) {
  logs.value.push({ type, message })
}

// 开始同步
async function startSync() {
  if (!configStore.isConfigValid()) {
    alert('请先在设置页面配置 API 信息')
    return
  }
  
  if (channelStore.channels.length === 0) {
    alert('请先在映射配置页面加载渠道列表')
    return
  }
  
  if (mappingStore.ruleCount === 0) {
    alert('请先添加映射规则')
    return
  }
  
  syncing.value = true
  logs.value = []
  
  addLog('info', `开始同步，模式: ${mappingStore.syncMode === 'append' ? '追加' : '覆盖'}`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const channel of channelStore.channels) {
    try {
      // 获取渠道的模型列表
      const upstreamModels = channelStore.getChannelModels(channel.id)
      
      if (upstreamModels.length === 0) {
        addLog('info', `跳过渠道 ${channel.name}：无模型数据`)
        continue
      }
      
      // 获取该渠道的排除列表
      const excludedModels = mappingStore.getChannelExclusion(channel.id)
      
      // 检查是否有未解决的重复冲突
      const duplicates = mappingStore.detectDuplicateTargets(upstreamModels, excludedModels)
      if (duplicates.length > 0) {
        const conflictInfo = duplicates.map(d => `${d.targetModel}(←${d.sourceModels.join(',')})`).join('; ')
        addLog('error', `渠道 ${channel.name} 有未解决的重复冲突: ${conflictInfo}`)
        errorCount++
        continue
      }
      
      // 生成配置（使用排除列表）
      const { models: newModels, modelMapping: newMapping } = mappingStore.generateChannelConfig(upstreamModels, excludedModels)
      
      if (!newModels) {
        addLog('info', `跳过渠道 ${channel.name}：无匹配规则`)
        continue
      }
      
      // 处理追加模式
      let finalModels = newModels
      let finalMapping = newMapping
      
      if (mappingStore.syncMode === 'append') {
        // 合并原有模型
        const originalModels = channel.models ? channel.models.split(',').map(m => m.trim()) : []
        const newModelList = newModels.split(',')
        const mergedModels = [...new Set([...originalModels, ...newModelList])]
        finalModels = mergedModels.join(',')
        
        // 合并原有映射
        let originalMappingObj: Record<string, string> = {}
        if (channel.model_mapping) {
          try {
            originalMappingObj = JSON.parse(channel.model_mapping)
          } catch {
            // 忽略解析错误
          }
        }
        const newMappingObj = JSON.parse(newMapping)
        finalMapping = JSON.stringify({ ...originalMappingObj, ...newMappingObj })
      }
      
      // 调用 API 更新
      await updateChannel(channel.id, finalModels, finalMapping)
      
      addLog('success', `渠道 ${channel.name} 同步成功`)
      successCount++
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知错误'
      addLog('error', `渠道 ${channel.name} 同步失败: ${errorMsg}`)
      errorCount++
    }
  }
  
  addLog('info', `同步完成！成功 ${successCount} 个，失败 ${errorCount} 个`)
  syncing.value = false
}
</script>

<style scoped>
.sync-view {
  padding: 24px;
  display: flex;
  gap: 24px;
  /* 使用 100% 高度填满父容器 */
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.left-panel {
  flex: 65;
  overflow-y: auto;
  /* 底部增加内边距，防止内容贴边被遮挡 */
  padding-bottom: 24px;
  /* 增加一点右侧内边距，避免滚动条挡住内容 */
  padding-right: 10px;
}

.right-panel {
  flex: 35;
  overflow-y: auto;
}

.sync-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
}

.sync-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.sync-desc {
  margin: 0 0 24px;
  color: #666;
  font-size: 14px;
}

.mode-section {
  margin-bottom: 24px;
}

.mode-title,
.preview-title,
.log-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mode-options {
  display: flex;
  gap: 12px;
}

.mode-option {
  flex: 1;
  display: block;
  cursor: pointer;
}

.mode-option input {
  display: none;
}

.mode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.mode-option:hover .mode-content {
  border-color: #667eea;
}

.mode-option.active .mode-content {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
}

.mode-icon {
  font-size: 24px;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mode-desc {
  font-size: 12px;
  color: #888;
  text-align: center;
}

.preview-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.preview-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.sync-actions {
  margin-bottom: 24px;
}

.btn-sync {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sync:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-log {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.log-item.info {
  background: #f5f5f5;
  color: #666;
}

.log-item.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.log-item.error {
  background: #ffebee;
  color: #c62828;
}

.log-icon {
  flex-shrink: 0;
}

.log-text {
  word-break: break-all;
}
</style>
