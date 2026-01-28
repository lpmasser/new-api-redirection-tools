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
        <div class="action-divider"></div>
        <button class="btn-icon" @click="exportRules" title="导出规则">
          📤
        </button>
        <button class="btn-icon" @click="triggerImport" title="导入规则">
          📥
        </button>
        <input 
          ref="fileInputRef" 
          type="file" 
          accept=".json" 
          style="display: none" 
          @change="handleFileSelect"
        />
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

    <!-- 导入模式选择弹窗 -->
    <div class="import-modal-overlay" v-if="showImportModal" @click.self="showImportModal = false">
      <div class="import-modal">
        <div class="modal-header">
          <h4>导入规则</h4>
          <button class="btn-modal-close" @click="showImportModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="file-info">文件: {{ importFileName }}</p>
          <div class="import-options">
            <label class="import-option">
              <input type="radio" v-model="importMode" value="overwrite" />
              <span class="option-content">
                <span class="option-title">覆盖现有规则</span>
                <span class="option-desc">清空当前所有规则后导入</span>
              </span>
            </label>
            <label class="import-option">
              <input type="radio" v-model="importMode" value="append" />
              <span class="option-content">
                <span class="option-title">追加到现有规则</span>
                <span class="option-desc">保留现有规则，仅添加不重复的规则</span>
              </span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showImportModal = false">取消</button>
          <button class="btn-confirm" @click="confirmImport">确认导入</button>
        </div>
      </div>
    </div>

    <!-- 自动处理规则配置面板 -->
    <div class="process-config-panel" v-show="showConfig">
      <!-- 基础选项 -->
      <div class="config-section">
        <!-- <div class="config-row">
          <label class="switch-item">
            <input type="checkbox" v-model="mappingStore.processConfig.formatModelName" />
            <span class="switch-slider"></span>
            <span class="switch-label">模型名格式化</span>
          </label>
        </div> -->
        
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
      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <button 
          class="filter-tab" 
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          全部 <span class="count">{{ mappingStore.ruleCount }}</span>
        </button>
        <button 
          class="filter-tab" 
          :class="{ active: filterType === 'redirected' }"
          @click="filterType = 'redirected'"
        >
          已重定向 <span class="count">{{ redirectedCount }}</span>
        </button>
        <button 
          class="filter-tab" 
          :class="{ active: filterType === 'not-redirected' }"
          @click="filterType = 'not-redirected'"
        >
          未重定向 <span class="count">{{ notRedirectedCount }}</span>
        </button>
      </div>
      
      <div class="rule-list">
        <div v-for="rule in filteredRules" :key="rule.sourceModel" class="rule-item" :class="{ 'is-redirected': rule.sourceModel !== rule.targetModel }">
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
        
        <!-- 筛选后无结果 -->
        <div class="empty-filter-result" v-if="filteredRules.length === 0">
          <span>没有{{ filterType === 'redirected' ? '已重定向' : '未重定向' }}的规则</span>
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
const fileInputRef = ref<HTMLInputElement | null>(null)
const showImportModal = ref(false)
const importMode = ref<'append' | 'overwrite'>('overwrite')
const importFileName = ref('')
let pendingImportData = ''

// 筛选类型
const filterType = ref<'all' | 'redirected' | 'not-redirected'>('all')

// 按优先级排序的自定义规则
const sortedCustomRules = computed(() => 
  [...mappingStore.customReplaceRules].sort((a, b) => a.priority - b.priority)
)

// 已重定向的规则数量
const redirectedCount = computed(() => 
  mappingStore.rules.filter(r => r.sourceModel !== r.targetModel).length
)

// 未重定向的规则数量
const notRedirectedCount = computed(() => 
  mappingStore.rules.filter(r => r.sourceModel === r.targetModel).length
)

// 筛选后的规则列表
const filteredRules = computed(() => {
  if (filterType.value === 'all') {
    return mappingStore.rules
  } else if (filterType.value === 'redirected') {
    return mappingStore.rules.filter(r => r.sourceModel !== r.targetModel)
  } else {
    return mappingStore.rules.filter(r => r.sourceModel === r.targetModel)
  }
})

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

function exportRules() {
  mappingStore.downloadRules()
}

function triggerImport() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  importFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    pendingImportData = e.target?.result as string
    showImportModal.value = true
  }
  reader.readAsText(file)
  
  // 清空 input 以便可以再次选择同一文件
  input.value = ''
}

function confirmImport() {
  if (!pendingImportData) return
  
  const result = mappingStore.importRules(pendingImportData, importMode.value)
  showImportModal.value = false
  
  if (result.success) {
    alert(result.message)
  } else {
    alert('导入失败: ' + result.message)
  }
  
  pendingImportData = ''
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

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 0;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.filter-tab {
  padding: 6px 14px;
  font-size: 12px;
  color: #666;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-right: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab:first-child {
  border-radius: 6px 0 0 6px;
}

.filter-tab:last-child {
  border-radius: 0 6px 6px 0;
  border-right: 1px solid #e0e0e0;
}

.filter-tab:hover {
  background: #f0f0f0;
}

.filter-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.filter-tab.active + .filter-tab {
  border-left-color: transparent;
}

.filter-tab .count {
  display: inline-block;
  min-width: 18px;
  padding: 1px 5px;
  margin-left: 4px;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.filter-tab.active .count {
  background: rgba(255, 255, 255, 0.25);
}

/* 已重定向的规则高亮 */
.rule-item.is-redirected .rule-source code {
  background: #e8f5e9;
  color: #2e7d32;
}

/* 筛选无结果 */
.empty-filter-result {
  padding: 30px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

/* 操作分隔符 */
.action-divider {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 4px;
}

/* 导入模态框 */
.import-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.import-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 380px;
  max-width: 90vw;
  overflow: hidden;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.modal-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.btn-modal-close {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 20px;
}

.file-info {
  margin: 0 0 16px;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  word-break: break-all;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.import-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #f9f9f9;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.import-option:hover {
  background: #f0f4ff;
}

.import-option:has(input:checked) {
  background: #f0f4ff;
  border-color: #667eea;
}

.import-option input {
  margin-top: 2px;
  accent-color: #667eea;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #888;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.btn-cancel {
  padding: 8px 18px;
  font-size: 13px;
  color: #666;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-confirm {
  padding: 8px 18px;
  font-size: 13px;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}
</style>
