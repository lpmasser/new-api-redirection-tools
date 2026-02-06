<template>
  <div class="channel-sync-list">
    <div class="section-header">
      <h3 class="section-title">📋 渠道同步配置</h3>
      <span class="section-desc">点击模型可切换排除状态，解决重复映射冲突</span>
    </div>
    
    <div class="channel-list">
      <div 
        v-for="channel in channelsWithModels" 
        :key="channel.id" 
        class="channel-item"
      >
        <div class="channel-header" @click="toggleChannel(channel.id)">
          <div class="channel-info">
            <span class="channel-name">{{ channel.name }}</span>
            <span class="channel-stats">
              <span class="stat matched">{{ getMatchedCount(channel) }} 匹配</span>
              <span class="stat excluded" v-if="getExcludedCount(channel) > 0">
                {{ getExcludedCount(channel) }} 排除
              </span>
              <span class="stat conflict" v-if="getDuplicates(channel).length > 0">
                ⚠️ {{ getDuplicates(channel).length }} 冲突
              </span>
            </span>
          </div>
          <span class="expand-icon">{{ expandedChannels.has(channel.id) ? '▼' : '▶' }}</span>
        </div>
        
        <div class="channel-body" v-show="expandedChannels.has(channel.id)">
          <!-- 冲突警告 -->
          <div class="conflict-warning" v-if="getDuplicates(channel).length > 0">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <div class="warning-title">检测到重复目标模型冲突</div>
              <div class="warning-desc">
                以下目标模型有多个源模型映射，请排除多余的源模型：
              </div>
              <div class="conflict-list">
                <div v-for="dup in getDuplicates(channel)" :key="dup.targetModel" class="conflict-item">
                  <code class="target-model">{{ dup.targetModel }}</code>
                  <span class="conflict-arrow">←</span>
                  <span class="source-models">
                    <code v-for="src in dup.sourceModels" :key="src">{{ src }}</code>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 模型列表 -->
          <div class="model-list">
            <div 
              v-for="item in getChannelMappings(channel)" 
              :key="item.sourceModel" 
              class="model-item"
              :class="{ 
                excluded: item.excluded, 
                conflict: item.hasConflict 
              }"
              @click="toggleExclusion(channel.id, item.sourceModel)"
            >
              <span class="model-status">
                {{ item.excluded ? '❌' : (item.hasConflict ? '⚠️' : '✅') }}
              </span>
              <code class="source-model">{{ item.sourceModel }}</code>
              <span class="model-arrow">→</span>
              <code class="target-model">{{ item.targetModel }}</code>
            </div>
          </div>
          
          <!-- 无匹配规则 -->
          <div class="empty-mappings" v-if="getChannelMappings(channel).length === 0">
            此渠道没有匹配的映射规则
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无渠道数据 -->
    <div class="empty-state" v-if="channelsWithModels.length === 0">
      <span class="empty-icon">📭</span>
      <p>暂无渠道数据</p>
      <p class="empty-hint">请先在映射配置页面加载渠道列表</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChannelStore } from '../stores/channel'
import { useMappingStore } from '../stores/mapping'
import type { Channel } from '../api/types'

const channelStore = useChannelStore()
const mappingStore = useMappingStore()

// 展开的渠道 ID 集合
const expandedChannels = ref<Set<number>>(new Set())

// 有模型数据的渠道列表
const channelsWithModels = computed(() => 
  channelStore.channels.filter(ch => {
    const models = channelStore.getChannelModels(ch.id)
    return models.length > 0
  })
)

// 切换渠道展开状态
function toggleChannel(channelId: number) {
  if (expandedChannels.value.has(channelId)) {
    expandedChannels.value.delete(channelId)
  } else {
    expandedChannels.value.add(channelId)
  }
}

// 获取渠道的匹配模型数量
function getMatchedCount(channel: Channel): number {
  const models = channelStore.getChannelModels(channel.id)
  const excluded = mappingStore.getChannelExclusion(channel.id)
  return models.filter(m => 
    mappingStore.hasRule(m) && !excluded.includes(m)
  ).length
}

// 获取渠道的排除模型数量
function getExcludedCount(channel: Channel): number {
  return mappingStore.getChannelExclusion(channel.id).length
}

// 获取渠道的重复冲突信息
function getDuplicates(channel: Channel) {
  const models = channelStore.getChannelModels(channel.id)
  const excluded = mappingStore.getChannelExclusion(channel.id)
  return mappingStore.detectDuplicateTargets(models, excluded)
}

// 获取渠道的映射列表（带冲突标记）
interface MappingItem {
  sourceModel: string
  targetModel: string
  excluded: boolean
  hasConflict: boolean
}

function getChannelMappings(channel: Channel): MappingItem[] {
  const models = channelStore.getChannelModels(channel.id)
  const excluded = mappingStore.getChannelExclusion(channel.id)
  const duplicates = getDuplicates(channel)
  
  // 收集所有有冲突的源模型
  const conflictSources = new Set<string>()
  for (const dup of duplicates) {
    for (const src of dup.sourceModels) {
      conflictSources.add(src)
    }
  }
  
  const result: MappingItem[] = []
  for (const model of models) {
    const target = mappingStore.getTargetModel(model)
    if (target) {
      result.push({
        sourceModel: model,
        targetModel: target,
        excluded: excluded.includes(model),
        hasConflict: conflictSources.has(model) && !excluded.includes(model)
      })
    }
  }
  
  return result
}

// 切换模型的排除状态
function toggleExclusion(channelId: number, model: string) {
  mappingStore.toggleModelExclusion(channelId, model)
}
</script>

<style scoped>
.channel-sync-list {
  background: transparent;
  padding: 0;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-desc {
  font-size: 12px;
  color: #888;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 防止子元素被拉伸 */
  align-items: stretch;
}

.channel-item {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  /* 防止被 flex 拉伸 */
  flex-shrink: 0;
  flex-grow: 0;
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.2s ease;
}

.channel-header:hover {
  background: #f0f0f0;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.channel-stats {
  display: flex;
  gap: 8px;
}

.stat {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.stat.matched {
  background: #e8f5e9;
  color: #2e7d32;
}

.stat.excluded {
  background: #fff3e0;
  color: #e65100;
}

.stat.conflict {
  background: #ffebee;
  color: #c62828;
}

.expand-icon {
  font-size: 10px;
  color: #888;
}

.channel-body {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

/* 冲突警告 */
.conflict-warning {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
  margin-bottom: 12px;
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 13px;
  font-weight: 600;
  color: #f57f17;
  margin-bottom: 4px;
}

.warning-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.conflict-arrow {
  color: #999;
}

.source-models {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.source-models code {
  background: #ffebee;
  color: #c62828;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

/* 模型列表 */
.model-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}

.model-item:hover {
  background: #f5f5f5;
}

.model-item.excluded {
  opacity: 0.5;
  background: #fafafa;
}

.model-item.conflict {
  background: #fff8e1;
}

.model-status {
  font-size: 12px;
  flex-shrink: 0;
}

.model-item code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.model-item code.source-model {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 限制最大宽度，防止挤压目标模型 */
  max-width: 60%;
}

.model-item code.target-model {
  color: #667eea;
  background: #f0f4ff;
  /* 确保目标模型有足够空间 */
  flex-shrink: 0;
  max-width: 35%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-arrow {
  color: #aaa;
}

.empty-mappings {
  padding: 20px;
  text-align: center;
  color: #888;
  font-size: 13px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #888;
}

.empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 12px;
  color: #aaa;
}
</style>
