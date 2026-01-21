<template>
  <div class="channel-card" :class="{ expanded }">
    <div class="card-header" @click="toggleExpand">
      <div class="card-info">
        <span class="channel-name">{{ channel.name }}</span>
        <span class="channel-status" :class="statusClass">
          {{ statusText }}
        </span>
        <span class="channel-tag" v-if="channel.tag">{{ channel.tag }}</span>
      </div>
      <div class="card-meta">
        <span class="model-count">{{ modelCount }} 模型</span>
        <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
      </div>
    </div>
    
    <div class="card-body" v-show="expanded">
      <div class="loading" v-if="loading">
        加载中...
      </div>
      <template v-else>
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input"
            placeholder="🔍 搜索模型..."
            @click.stop
          />
        </div>
        
        <!-- 模型列表 -->
        <div class="model-list">
          <label 
            v-for="model in filteredModels" 
            :key="model" 
            class="model-item"
            :class="{ selected: isSelected(model) }"
          >
            <input 
              type="checkbox" 
              :checked="isSelected(model)"
              @change="toggleModel(model)"
            />
            <span class="model-name">{{ model }}</span>
            <span class="mapped-to" v-if="getMappedTarget(model)">
              → {{ getMappedTarget(model) }}
            </span>
          </label>
          <div class="no-results" v-if="filteredModels.length === 0">
            未找到匹配的模型
          </div>
        </div>
      </template>
      <div class="card-actions">
        <button class="btn-small" @click.stop="refreshModels">
          🔄 刷新上游模型
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Channel } from '../api/types'
import { useChannelStore } from '../stores/channel'
import { useMappingStore } from '../stores/mapping'

const props = defineProps<{
  channel: Channel
}>()

const channelStore = useChannelStore()
const mappingStore = useMappingStore()

const expanded = ref(false)
const loading = ref(false)
const searchQuery = ref('')

// 渠道状态
const statusClass = computed(() => ({
  'status-active': props.channel.status === 1,
  'status-inactive': props.channel.status !== 1
}))

const statusText = computed(() => 
  props.channel.status === 1 ? '✅ 正常' : '⏸️ 禁用'
)

// 模型列表
const models = computed(() => 
  channelStore.getChannelModels(props.channel.id)
)

// 过滤后的模型列表
const filteredModels = computed(() => {
  if (!searchQuery.value.trim()) {
    return models.value
  }
  const query = searchQuery.value.toLowerCase()
  return models.value.filter(model => 
    model.toLowerCase().includes(query)
  )
})

const modelCount = computed(() => models.value.length)

// 检查模型是否被选中
function isSelected(model: string): boolean {
  return mappingStore.hasRule(model)
}

// 获取模型的映射目标
function getMappedTarget(model: string): string | undefined {
  return mappingStore.getTargetModel(model)
}

// 切换模型选中状态
function toggleModel(model: string) {
  if (isSelected(model)) {
    mappingStore.removeRule(model)
  } else {
    mappingStore.addRule(model)
  }
}

// 展开/收起
async function toggleExpand() {
  expanded.value = !expanded.value
  
  // 首次展开时加载上游模型（如果没有缓存）
  if (expanded.value && !props.channel.upstreamModels) {
    await refreshModels()
  }
}

// 刷新上游模型
async function refreshModels() {
  loading.value = true
  try {
    await channelStore.loadUpstreamModels(props.channel.id)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.channel-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.2s ease;
}

.channel-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.channel-card.expanded {
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.card-header:hover {
  background: #f8f9fa;
}

.card-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.channel-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background: #f5f5f5;
  color: #757575;
}

.channel-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #888;
  font-size: 13px;
}

.expand-icon {
  font-size: 10px;
  color: #aaa;
}

.card-body {
  padding: 0 20px 20px;
  border-top: 1px solid #f0f0f0;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #888;
}

.search-box {
  padding-top: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.model-item:hover {
  background: #f5f5f5;
}

.model-item.selected {
  background: #e8eaf6;
}

.model-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.model-name {
  flex: 1;
  font-size: 13px;
  color: #333;
  font-family: 'Consolas', 'Monaco', monospace;
}

.mapped-to {
  font-size: 12px;
  color: #667eea;
  font-family: 'Consolas', 'Monaco', monospace;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #888;
  font-size: 13px;
}

.card-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small:hover {
  background: #eee;
  color: #333;
}
</style>
