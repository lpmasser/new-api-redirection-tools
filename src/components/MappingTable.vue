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

<style scoped src="./MappingTable.css"></style>
