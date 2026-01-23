<template>
  <div class="mapping-table">
    <div class="table-header">
      <h3 class="table-title">映射规则</h3>
      <span class="rule-count">{{ mappingStore.ruleCount }} 条</span>
    </div>
    
    <div class="table-actions">
      <div class="action-group">
        <button class="btn-tool" @click="autoProcess" title="执行所有启用的规则">
          ✨ 自动处理
        </button>
        <button class="btn-icon" @click="toggleConfig" :class="{ active: showConfig }" title="规则设置">
          ⚙️
        </button>
      </div>
      
      <button 
        v-if="mappingStore.ruleCount > 0" 
        class="btn-clear" 
        @click="clearAll"
        title="清空所有映射规则"
      >
        🗑️ 清空
      </button>
    </div>

    <!-- 自动处理规则配置面板 -->
    <div class="process-config-panel" v-show="showConfig">
      <!-- 基础选项 -->
      <div class="config-section">
        <div class="config-row">
          <label class="switch-item">
            <input type="checkbox" v-model="mappingStore.processConfig.formatModelName" />
            <span class="switch-slider"></span>
            <span class="switch-label">模型名格式化</span>
          </label>
        </div>
        
        <div class="config-row">
          <label class="switch-item">
            <input type="checkbox" v-model="mappingStore.processConfig.toLowerCase" />
            <span class="switch-slider"></span>
            <span class="switch-label">转为小写</span>
          </label>
        </div>
        
        <div class="config-row">
          <label class="switch-item">
            <input type="checkbox" v-model="mappingStore.processConfig.enableCustomRules" />
            <span class="switch-slider"></span>
            <span class="switch-label">自定义规则</span>
          </label>
        </div>
      </div>
      
      <!-- 自定义替换规则 -->
      <div class="custom-rules-section" v-show="mappingStore.processConfig.enableCustomRules">
        <div class="section-header">
          <span class="section-title">自定义替换规则</span>
          <button class="btn-add" @click="mappingStore.addCustomRule()">
            + 添加
          </button>
        </div>
        
        <div class="custom-rules-list" v-if="mappingStore.customReplaceRules.length > 0">
          <div 
            v-for="rule in sortedCustomRules" 
            :key="rule.id" 
            class="custom-rule-item"
          >
            <input 
              type="number" 
              :value="rule.priority"
              @input="mappingStore.updateCustomRule(rule.id, { priority: Number(($event.target as HTMLInputElement).value) })"
              class="priority-input"
              title="优先级（数字越小优先级越高）"
              min="1"
            />
            <input 
              type="text" 
              :value="rule.search"
              @input="mappingStore.updateCustomRule(rule.id, { search: ($event.target as HTMLInputElement).value })"
              class="search-input"
              placeholder="查找"
            />
            <span class="replace-arrow">→</span>
            <input 
              type="text" 
              :value="rule.replace"
              @input="mappingStore.updateCustomRule(rule.id, { replace: ($event.target as HTMLInputElement).value })"
              class="replace-input"
              placeholder="替换为"
            />
            <label class="mini-switch" title="启用/禁用">
              <input 
                type="checkbox" 
                :checked="rule.enabled"
                @change="mappingStore.updateCustomRule(rule.id, { enabled: !rule.enabled })"
              />
              <span class="mini-slider"></span>
            </label>
            <button class="btn-remove" @click="mappingStore.removeCustomRule(rule.id)" title="删除">
              ✕
            </button>
          </div>
        </div>
        
        <div class="empty-custom-rules" v-else>
          <span>暂无自定义规则，点击"添加"创建</span>
        </div>
      </div>
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
import { ref, computed } from 'vue'
import { useMappingStore } from '../stores/mapping'

const mappingStore = useMappingStore()
const showConfig = ref(false)

// 按优先级排序的自定义规则
const sortedCustomRules = computed(() => 
  [...mappingStore.customReplaceRules].sort((a, b) => a.priority - b.priority)
)

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

function autoProcess() {
  mappingStore.autoProcessRules()
}

function toggleConfig() {
  showConfig.value = !showConfig.value
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
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fdfdfd;
  flex-shrink: 0;
}

.action-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-tool {
  padding: 6px 14px;
  font-size: 13px;
  color: #667eea;
  background: #f0f4ff;
  border: 1px solid #667eea;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.btn-tool:hover {
  background: #667eea;
  color: #fff;
}

.btn-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover, .btn-icon.active {
  background: #f5f5f5;
  color: #333;
}

.btn-icon.active {
  background: #e0e0e0;
}

.btn-clear {
  padding: 6px 12px;
  font-size: 12px;
  color: #e53935;
  background: transparent;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: #ffebee;
  border-color: #e53935;
}

/* 自动处理配置面板 */
.process-config-panel {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-row {
  display: flex;
  align-items: center;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.switch-item input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 36px;
  height: 20px;
  background-color: #ccc;
  border-radius: 20px;
  transition: 0.3s;
  flex-shrink: 0;
}

.switch-slider:before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.switch-item input:checked + .switch-slider {
  background-color: #667eea;
}

.switch-item input:checked + .switch-slider:before {
  transform: translateX(16px);
}

.switch-label {
  font-size: 13px;
  color: #444;
}

/* 自定义规则区域 */
.custom-rules-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ddd;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.btn-add {
  padding: 4px 10px;
  font-size: 12px;
  color: #667eea;
  background: #fff;
  border: 1px solid #667eea;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background: #667eea;
  color: #fff;
}

.custom-rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-rule-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.priority-input {
  width: 45px;
  padding: 4px 6px;
  font-size: 12px;
  text-align: center;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  outline: none;
}

.priority-input:focus {
  border-color: #667eea;
}

.search-input,
.replace-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  outline: none;
}

.search-input:focus,
.replace-input:focus {
  border-color: #667eea;
}

.replace-arrow {
  color: #aaa;
  font-size: 11px;
  flex-shrink: 0;
}

/* 迷你开关 */
.mini-switch {
  position: relative;
  cursor: pointer;
}

.mini-switch input {
  display: none;
}

.mini-slider {
  display: block;
  width: 28px;
  height: 16px;
  background-color: #ccc;
  border-radius: 16px;
  transition: 0.3s;
}

.mini-slider:before {
  content: "";
  position: absolute;
  height: 12px;
  width: 12px;
  left: 2px;
  top: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.mini-switch input:checked + .mini-slider {
  background-color: #667eea;
}

.mini-switch input:checked + .mini-slider:before {
  transform: translateX(12px);
}

.btn-remove {
  width: 20px;
  height: 20px;
  font-size: 10px;
  color: #999;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-remove:hover {
  color: #e53935;
  border-color: #e53935;
  background: #ffebee;
}

.empty-custom-rules {
  padding: 12px;
  text-align: center;
  color: #888;
  font-size: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px dashed #ddd;
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
  gap: 10px;
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
  padding: 6px 10px;
  border-radius: 6px;
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
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  outline: none;
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
