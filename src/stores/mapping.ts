import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MappingRule } from '../api/types'

export const useMappingStore = defineStore('mapping', () => {
    // 状态
    const rules = ref<MappingRule[]>([])
    const syncMode = ref<'append' | 'overwrite'>('append')

    // 添加映射规则
    function addRule(sourceModel: string, targetModel: string = '') {
        // 检查是否已存在
        const existing = rules.value.find(r => r.sourceModel === sourceModel)
        if (existing) return

        rules.value.push({
            sourceModel,
            targetModel: targetModel || sourceModel // 默认使用原名
        })
    }

    // 删除映射规则
    function removeRule(sourceModel: string) {
        const index = rules.value.findIndex(r => r.sourceModel === sourceModel)
        if (index !== -1) {
            rules.value.splice(index, 1)
        }
    }

    // 更新映射规则的目标名称
    function updateTargetModel(sourceModel: string, targetModel: string) {
        const rule = rules.value.find(r => r.sourceModel === sourceModel)
        if (rule) {
            rule.targetModel = targetModel
        }
    }

    // 检查模型是否在规则中
    function hasRule(sourceModel: string): boolean {
        return rules.value.some(r => r.sourceModel === sourceModel)
    }

    // 获取规则的目标模型
    function getTargetModel(sourceModel: string): string | undefined {
        const rule = rules.value.find(r => r.sourceModel === sourceModel)
        return rule?.targetModel
    }

    // 为指定渠道生成 models 和 model_mapping
    function generateChannelConfig(upstreamModels: string[]): { models: string; modelMapping: string } {
        const matchedRules: MappingRule[] = []
        const targetModels = new Set<string>()

        // 遍历上游模型，匹配规则
        for (const model of upstreamModels) {
            const rule = rules.value.find(r => r.sourceModel === model)
            if (rule) {
                matchedRules.push(rule)
                targetModels.add(rule.targetModel)
            }
        }

        // 生成 model_mapping JSON
        const mappingObj: Record<string, string> = {}
        for (const rule of matchedRules) {
            mappingObj[rule.sourceModel] = rule.targetModel
        }

        return {
            models: Array.from(targetModels).join(','),
            modelMapping: JSON.stringify(mappingObj)
        }
    }

    // 清空所有规则
    function clearRules() {
        rules.value = []
    }

    // 获取所有规则数量
    const ruleCount = computed(() => rules.value.length)

    return {
        rules,
        syncMode,
        addRule,
        removeRule,
        updateTargetModel,
        hasRule,
        getTargetModel,
        generateChannelConfig,
        clearRules,
        ruleCount
    }
}, {
    persist: true
})
