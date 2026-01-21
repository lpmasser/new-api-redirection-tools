<template>
  <div class="mapping-table">
    <div class="table-header">
      <h3 class="table-title">映射规则</h3>
      <span class="rule-count">{{ mappingStore.ruleCount }} 条</span>
    </div>
    
    <div class="table-actions">
      <button class="btn-auto" @click="autoProcess">
        ✨ 自动处理
      </button>
      <button 
        v-if="mappingStore.ruleCount > 0" 
        class="btn-clear" 
        @click="clearAll"
      >
        🗑️ 清空
      </button>
    </div>
    
    <div class="table-wrapper" v-if="mappingStore.rules.length > 0">
      <div class="rule-list">
        <div v-for="rule in mappingStore.rules" :key="rule.sourceModel" class="rule-item">
          <div class="rule-source">
            <code>{{ rule.sourceModel }}</code>
          </div>
          <span class="rule-arrow">→</span>
          <input 
            type="text" 
            :value="rule.targetModel"
            @input="updateTarget(rule.sourceModel, ($event.target as HTMLInputElement).value)"
            class="rule-target-input"
            placeholder="统一命名"
          />
          <button class="btn-delete" @click="removeRule(rule.sourceModel)">
            ✕
          </button>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <span class="empty-icon">📋</span>
      <p>暂无映射规则</p>
      <p class="empty-hint">在左侧渠道中勾选模型</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMappingStore } from '../stores/mapping'

const mappingStore = useMappingStore()

function updateTarget(sourceModel: string, targetModel: string) {
  mappingStore.updateTargetModel(sourceModel, targetModel)
}

function removeRule(sourceModel: string) {
  mappingStore.removeRule(sourceModel)
}

function clearAll() {
  if (confirm('确定要清空所有映射规则吗？')) {
    mappingStore.clearRules()
  }
}

// 自动处理：将所有模型名称转为小写
function autoProcess() {
  mappingStore.autoProcessRules()
}
</script>

<style scoped>
.mapping-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.table-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.rule-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.table-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.btn-auto {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  color: #667eea;
  background: #f0f4ff;
  border: 1px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-auto:hover {
  background: #667eea;
  color: #fff;
}

.btn-clear {
  padding: 8px 12px;
  font-size: 13px;
  color: #e53935;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  border-color: #e53935;
  background: #ffebee;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
}

.rule-list {
  display: flex;
  flex-direction: column;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.rule-item:hover {
  background: #fafafa;
}

.rule-source {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.rule-source code {
  display: block;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #333;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rule-arrow {
  color: #aaa;
  font-size: 12px;
  flex-shrink: 0;
}

.rule-target-input {
  width: 100px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  outline: none;
  flex-shrink: 0;
}

.rule-target-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
}

.btn-delete {
  width: 24px;
  height: 24px;
  font-size: 10px;
  color: #999;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  color: #e53935;
  border-color: #e53935;
  background: #ffebee;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  color: #888;
}

.empty-icon {
  font-size: 32px;
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
