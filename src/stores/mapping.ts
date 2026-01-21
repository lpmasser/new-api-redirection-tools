import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MappingRule } from '../api/types'

// 自动处理规则配置
export interface ProcessRuleConfig {
    toLowerCase: boolean       // 转为小写
    removePreviewSuffix: boolean  // 移除 -preview 后缀
    removeDateSuffix: boolean     // 移除日期后缀 (如 -0125, -20240125)
}

export const useMappingStore = defineStore('mapping', () => {
    // 状态
    const rules = ref<MappingRule[]>([])
    const syncMode = ref<'append' | 'overwrite'>('append')

    // 自动处理规则配置
    const processConfig = ref<ProcessRuleConfig>({
        toLowerCase: true,
        removePreviewSuffix: false,
        removeDateSuffix: false
    })

    // 添加映射规则
    function addRule(sourceModel: string, targetModel: string = '') {
        const existing = rules.value.find(r => r.sourceModel === sourceModel)
        if (existing) return

        rules.value.push({
            sourceModel,
            targetModel: targetModel || sourceModel
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

        for (const model of upstreamModels) {
            const rule = rules.value.find(r => r.sourceModel === model)
            if (rule) {
                matchedRules.push(rule)
                targetModels.add(rule.targetModel)
            }
        }

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

    // 应用单个处理规则到字符串
    function applyProcessRules(modelName: string): string {
        let result = modelName

        // 转为小写
        if (processConfig.value.toLowerCase) {
            result = result.toLowerCase()
        }

        // 移除 -preview 后缀
        if (processConfig.value.removePreviewSuffix) {
            result = result.replace(/-preview$/i, '')
        }

        // 移除日期后缀 (如 -0125, -20240125, -2024-01-25)
        if (processConfig.value.removeDateSuffix) {
            result = result.replace(/-\d{4,8}$/i, '')  // -0125 或 -20240125
            result = result.replace(/-\d{4}-\d{2}-\d{2}$/i, '')  // -2024-01-25
        }

        return result
    }

    // 自动处理所有规则
    function autoProcessRules() {
        for (const rule of rules.value) {
            rule.targetModel = applyProcessRules(rule.sourceModel)
        }
    }

    // 获取所有规则数量
    const ruleCount = computed(() => rules.value.length)

    return {
        rules,
        syncMode,
        processConfig,
        addRule,
        removeRule,
        updateTargetModel,
        hasRule,
        getTargetModel,
        generateChannelConfig,
        clearRules,
        autoProcessRules,
        ruleCount
    }
}, {
    persist: true
})
