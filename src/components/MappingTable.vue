<template>
  <div class="mapping-table">
    <div class="table-header">
      <h3 class="table-title">映射规则</h3>
      <span class="rule-count">{{ mappingStore.ruleCount }} 条规则</span>
      <button 
        v-if="mappingStore.ruleCount > 0" 
        class="btn-clear" 
        @click="clearAll"
      >
        清空全部
      </button>
    </div>
    
    <div class="table-wrapper" v-if="mappingStore.rules.length > 0">
      <table>
        <thead>
          <tr>
            <th class="col-source">原模型名</th>
            <th class="col-arrow"></th>
            <th class="col-target">统一命名</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in mappingStore.rules" :key="rule.sourceModel">
            <td class="col-source">
              <code>{{ rule.sourceModel }}</code>
            </td>
            <td class="col-arrow">→</td>
            <td class="col-target">
              <input 
                type="text" 
                :value="rule.targetModel"
                @input="updateTarget(rule.sourceModel, ($event.target as HTMLInputElement).value)"
                class="target-input"
                placeholder="输入统一命名"
              />
            </td>
            <td class="col-action">
              <button class="btn-delete" @click="removeRule(rule.sourceModel)">
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="empty-state" v-else>
      <span class="empty-icon">📋</span>
      <p>暂无映射规则</p>
      <p class="empty-hint">在下方渠道卡片中勾选模型以添加规则</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMappingStore } from '../stores/mapping'

const mappingStore = useMappingStore()

// 更新目标模型名
function updateTarget(sourceModel: string, targetModel: string) {
  mappingStore.updateTargetModel(sourceModel, targetModel)
}

// 删除规则
function removeRule(sourceModel: string) {
  mappingStore.removeRule(sourceModel)
}

// 清空所有规则
function clearAll() {
  if (confirm('确定要清空所有映射规则吗？')) {
    mappingStore.clearRules()
  }
}
</script>

<style scoped>
.mapping-table {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.table-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.rule-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 10px;
  border-radius: 12px;
}

.btn-clear {
  margin-left: auto;
  padding: 6px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.25);
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  background: #fafafa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.col-source {
  width: 40%;
}

.col-arrow {
  width: 40px;
  text-align: center;
  color: #aaa;
}

.col-target {
  width: 40%;
}

.col-action {
  width: 60px;
  text-align: center;
}

td code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #333;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.target-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.target-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
}

.btn-delete {
  width: 28px;
  height: 28px;
  font-size: 12px;
  color: #999;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  color: #e53935;
  border-color: #e53935;
  background: #ffebee;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #888;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #aaa;
}
</style>
