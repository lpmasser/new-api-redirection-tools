import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MappingRule } from '../api/types'

// 自定义替换规则
export interface CustomReplaceRule {
    id: string           // 唯一标识
    priority: number     // 优先级（数字越小优先级越高）
    search: string       // 需要替换的字符串
    replace: string      // 替换后的字符串
    enabled: boolean     // 是否启用
}

// 自动处理规则配置
export interface ProcessRuleConfig {
    formatModelName: boolean    // 模型名格式化（移除特殊字符等）
    enableCustomRules: boolean  // 启用自定义规则
    toLowerCase: boolean        // 转为小写
}

export const useMappingStore = defineStore('mapping', () => {
    // 状态
    const rules = ref<MappingRule[]>([])
    const syncMode = ref<'append' | 'overwrite'>('append')

    // 自动处理规则配置
    const processConfig = ref<ProcessRuleConfig>({
        formatModelName: false,
        enableCustomRules: false,
        toLowerCase: true
    })

    // 自定义替换规则列表
    const customReplaceRules = ref<CustomReplaceRule[]>([])

    // 生成唯一 ID
    function generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
    }

    // 添加自定义替换规则
    function addCustomRule(search: string = '', replace: string = '') {
        const maxPriority = customReplaceRules.value.reduce((max, r) => Math.max(max, r.priority), 0)
        customReplaceRules.value.push({
            id: generateId(),
            priority: maxPriority + 1,
            search,
            replace,
            enabled: true
        })
    }

    // 删除自定义替换规则
    function removeCustomRule(id: string) {
        const index = customReplaceRules.value.findIndex(r => r.id === id)
        if (index !== -1) {
            customReplaceRules.value.splice(index, 1)
        }
    }

    // 更新自定义替换规则
    function updateCustomRule(id: string, updates: Partial<CustomReplaceRule>) {
        const rule = customReplaceRules.value.find(r => r.id === id)
        if (rule) {
            Object.assign(rule, updates)
        }
    }

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

    // 应用处理规则到字符串
    function applyProcessRules(modelName: string): string {
        let result = modelName

        // 模型名格式化（移除特殊字符等，后续可扩展）
        if (processConfig.value.formatModelName) {
            // 目前只移除首尾空格，后续可以添加更多格式化规则
            result = result.trim()
        }

        // 应用自定义替换规则（按优先级排序）
        if (processConfig.value.enableCustomRules) {
            const sortedRules = [...customReplaceRules.value]
                .filter(r => r.enabled && r.search)
                .sort((a, b) => a.priority - b.priority)

            for (const rule of sortedRules) {
                // 使用 split/join 替代 replaceAll 以兼容旧版本
                result = result.split(rule.search).join(rule.replace)
            }
        }

        // 转为小写
        if (processConfig.value.toLowerCase) {
            result = result.toLowerCase()
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

    // 获取自定义规则数量
    const customRuleCount = computed(() => customReplaceRules.value.length)

    return {
        rules,
        syncMode,
        processConfig,
        customReplaceRules,
        addRule,
        removeRule,
        updateTargetModel,
        hasRule,
        getTargetModel,
        generateChannelConfig,
        clearRules,
        autoProcessRules,
        addCustomRule,
        removeCustomRule,
        updateCustomRule,
        ruleCount,
        customRuleCount
    }
}, {
    persist: true
})
