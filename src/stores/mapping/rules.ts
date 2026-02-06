import type { ChannelExclusion, MappingRule } from '../../api/types'
import type { CustomReplaceRule, DuplicateInfo, ProcessRuleConfig } from './types'

// 生成本地规则的唯一 ID。
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

// 新增一条自定义替换规则，并自动分配优先级。
export function addCustomRule(
    customReplaceRules: CustomReplaceRule[],
    search: string = '',
    replace: string = '',
    idGenerator: () => string = generateId
): void {
    const maxPriority = customReplaceRules.reduce((max, rule) => Math.max(max, rule.priority), 0)
    customReplaceRules.push({
        id: idGenerator(),
        priority: maxPriority + 1,
        search,
        replace,
        enabled: true
    })
}

// 按 ID 删除自定义替换规则。
export function removeCustomRule(customReplaceRules: CustomReplaceRule[], id: string): void {
    const index = customReplaceRules.findIndex(rule => rule.id === id)
    if (index !== -1) {
        customReplaceRules.splice(index, 1)
    }
}

// 按 ID 局部更新自定义替换规则字段。
export function updateCustomRule(
    customReplaceRules: CustomReplaceRule[],
    id: string,
    updates: Partial<CustomReplaceRule>
): void {
    const rule = customReplaceRules.find(item => item.id === id)
    if (rule) {
        Object.assign(rule, updates)
    }
}

// 添加映射规则；若 sourceModel 已存在则不重复添加。
export function addRule(rules: MappingRule[], sourceModel: string, targetModel: string = ''): boolean {
    const existing = rules.find(rule => rule.sourceModel === sourceModel)
    if (existing) return false

    rules.push({
        sourceModel,
        targetModel: targetModel || sourceModel
    })
    return true
}

// 按 sourceModel 删除映射规则。
export function removeRule(rules: MappingRule[], sourceModel: string): void {
    const index = rules.findIndex(rule => rule.sourceModel === sourceModel)
    if (index !== -1) {
        rules.splice(index, 1)
    }
}

// 更新指定 sourceModel 对应的目标模型名。
export function updateTargetModel(rules: MappingRule[], sourceModel: string, targetModel: string): void {
    const rule = rules.find(item => item.sourceModel === sourceModel)
    if (rule) {
        rule.targetModel = targetModel
    }
}

// 判断给定 sourceModel 是否已存在规则。
export function hasRule(rules: MappingRule[], sourceModel: string): boolean {
    return rules.some(rule => rule.sourceModel === sourceModel)
}

// 获取给定 sourceModel 对应的目标模型名。
export function getTargetModel(rules: MappingRule[], sourceModel: string): string | undefined {
    const rule = rules.find(item => item.sourceModel === sourceModel)
    return rule?.targetModel
}

// 返回清空后的规则列表（用于替换当前状态）。
export function clearRules(): MappingRule[] {
    return []
}

// 获取指定渠道的排除模型列表。
export function getChannelExclusion(channelExclusions: ChannelExclusion[], channelId: number): string[] {
    const exclusion = channelExclusions.find(item => item.channelId === channelId)
    return exclusion?.excludedModels || []
}

// 设置指定渠道的排除模型列表（存在则覆盖，不存在则新增）。
export function setChannelExclusion(
    channelExclusions: ChannelExclusion[],
    channelId: number,
    excludedModels: string[]
): void {
    const existing = channelExclusions.find(item => item.channelId === channelId)
    if (existing) {
        existing.excludedModels = excludedModels
    } else {
        channelExclusions.push({ channelId, excludedModels })
    }
}

// 切换某个模型在指定渠道中的排除状态。
export function toggleModelExclusion(
    channelExclusions: ChannelExclusion[],
    channelId: number,
    model: string
): void {
    const exclusion = channelExclusions.find(item => item.channelId === channelId)
    if (exclusion) {
        const index = exclusion.excludedModels.indexOf(model)
        if (index === -1) {
            exclusion.excludedModels.push(model)
        } else {
            exclusion.excludedModels.splice(index, 1)
        }
    } else {
        channelExclusions.push({ channelId, excludedModels: [model] })
    }
}

// 判断某个模型在指定渠道中是否被排除。
export function isModelExcluded(
    channelExclusions: ChannelExclusion[],
    channelId: number,
    model: string
): boolean {
    const exclusion = channelExclusions.find(item => item.channelId === channelId)
    return exclusion?.excludedModels.includes(model) || false
}

// 根据渠道上游模型和排除列表生成可提交的 models 与 model_mapping。
export function generateChannelConfig(
    rules: MappingRule[],
    upstreamModels: string[],
    excludedModels: string[] = []
): { models: string; modelMapping: string } {
    const matchedRules: MappingRule[] = []
    const targetModels = new Set<string>()
    const excludedSet = new Set(excludedModels)

    for (const model of upstreamModels) {
        if (excludedSet.has(model)) continue

        const rule = rules.find(item => item.sourceModel === model)
        if (rule) {
            matchedRules.push(rule)
            targetModels.add(rule.targetModel)
        }
    }

    const mappingObj: Record<string, string> = {}
    for (const rule of matchedRules) {
        if (rule.sourceModel !== rule.targetModel) {
            mappingObj[rule.targetModel] = rule.sourceModel
        }
    }

    return {
        models: Array.from(targetModels).join(','),
        modelMapping: JSON.stringify(mappingObj)
    }
}

// 检测多个 sourceModel 映射到同一 targetModel 的冲突项。
export function detectDuplicateTargets(
    rules: MappingRule[],
    upstreamModels: string[],
    excludedModels: string[] = []
): DuplicateInfo[] {
    const excludedSet = new Set(excludedModels)
    const targetToSources: Record<string, string[]> = {}

    for (const model of upstreamModels) {
        if (excludedSet.has(model)) continue

        const rule = rules.find(item => item.sourceModel === model)
        if (rule) {
            if (!targetToSources[rule.targetModel]) {
                targetToSources[rule.targetModel] = []
            }
            targetToSources[rule.targetModel]!.push(model)
        }
    }

    return Object.entries(targetToSources)
        .filter(([_, sources]) => sources.length > 1)
        .map(([targetModel, sourceModels]) => ({ targetModel, sourceModels }))
}

// 将处理配置和自定义替换规则应用到单个模型名。
export function applyProcessRules(
    modelName: string,
    processConfig: ProcessRuleConfig,
    customReplaceRules: CustomReplaceRule[]
): string {
    let result = modelName

    if (processConfig.formatModelName) {
        result = result.trim()
    }

    if (processConfig.enableCustomRules) {
        const sortedRules = [...customReplaceRules]
            .filter(rule => rule.enabled && rule.search)
            .sort((a, b) => a.priority - b.priority)

        for (const rule of sortedRules) {
            result = result.split(rule.search).join(rule.replace)
        }
    }

    if (processConfig.toLowerCase) {
        result = result.toLowerCase()
    }

    return result
}

// 批量处理所有规则的 targetModel。
export function autoProcessRules(
    rules: MappingRule[],
    processConfig: ProcessRuleConfig,
    customReplaceRules: CustomReplaceRule[]
): void {
    for (const rule of rules) {
        rule.targetModel = applyProcessRules(rule.targetModel, processConfig, customReplaceRules)
    }
}
