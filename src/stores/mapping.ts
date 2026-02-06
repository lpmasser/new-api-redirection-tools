import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { MappingRule, ChannelExclusion, Channel } from '../api/types'
import {
    fetchMappingRules,
    saveMappingRules,
    fetchCustomRules,
    saveCustomRules,
    fetchConfig,
    saveConfig,
    fetchChannelExclusions,
    saveChannelExclusions,
    type CustomReplaceRule as BackendCustomRule,
    type AppConfig
} from '../api/backend'

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

    // 渠道排除配置列表
    const channelExclusions = ref<ChannelExclusion[]>([])

    // 加载状态
    const loading = ref(false)
    const loaded = ref(false)
    const saving = ref(false)

    // 防抖保存计时器
    let saveTimer: ReturnType<typeof setTimeout> | null = null

    // 从服务器加载数据
    async function loadFromServer(): Promise<void> {
        if (loading.value) return

        loading.value = true
        try {
            // 并行加载所有数据
            const [mappingRulesData, customRulesData, configData, exclusionsData] = await Promise.all([
                fetchMappingRules(),
                fetchCustomRules(),
                fetchConfig(),
                fetchChannelExclusions()
            ])

            rules.value = mappingRulesData
            channelExclusions.value = exclusionsData
            customReplaceRules.value = customRulesData as CustomReplaceRule[]

            // 加载配置
            if (configData.syncMode) {
                syncMode.value = configData.syncMode
            }
            if (configData.processConfig) {
                processConfig.value = {
                    ...processConfig.value,
                    ...configData.processConfig
                }
            }

            loaded.value = true
        } catch (error) {
            console.error('Failed to load data from server:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    // 保存数据到服务器（防抖）
    function saveToServer(): void {
        if (saveTimer) {
            clearTimeout(saveTimer)
        }

        saveTimer = setTimeout(async () => {
            if (saving.value) return

            saving.value = true
            try {
                await Promise.all([
                    saveMappingRules(rules.value),
                    saveCustomRules(customReplaceRules.value as BackendCustomRule[]),
                    saveConfig({
                        syncMode: syncMode.value,
                        processConfig: processConfig.value
                    } as AppConfig),
                    saveChannelExclusions(channelExclusions.value)
                ])
            } catch (error) {
                console.error('Failed to save data to server:', error)
            } finally {
                saving.value = false
            }
        }, 500) // 500ms 防抖
    }

    // 监听数据变化，自动保存
    watch(
        () => [rules.value, customReplaceRules.value, syncMode.value, processConfig.value, channelExclusions.value],
        () => {
            if (loaded.value) {
                saveToServer()
            }
        },
        { deep: true }
    )

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

    // 为指定渠道生成 models 和 model_mapping（支持排除列表）
    // models: 所有目标模型名称（重定向后的名称）
    // model_mapping: 只包含有更改的映射（source !== target）
    function generateChannelConfig(upstreamModels: string[], excludedModels: string[] = []): { models: string; modelMapping: string } {
        const matchedRules: MappingRule[] = []
        const targetModels = new Set<string>()
        const excludedSet = new Set(excludedModels)

        for (const model of upstreamModels) {
            // 跳过排除的模型
            if (excludedSet.has(model)) continue

            const rule = rules.value.find(r => r.sourceModel === model)
            if (rule) {
                matchedRules.push(rule)
                targetModels.add(rule.targetModel)
            }
        }

        // 只有 source !== target 的才需要写进 mapping
        // key: 请求中的模型名称（targetModel），value: 实际上游模型名（sourceModel）
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

    // 获取指定渠道的排除模型列表
    function getChannelExclusion(channelId: number): string[] {
        const exclusion = channelExclusions.value.find(e => e.channelId === channelId)
        return exclusion?.excludedModels || []
    }

    // 设置指定渠道的排除模型列表
    function setChannelExclusion(channelId: number, excludedModels: string[]) {
        const existing = channelExclusions.value.find(e => e.channelId === channelId)
        if (existing) {
            existing.excludedModels = excludedModels
        } else {
            channelExclusions.value.push({ channelId, excludedModels })
        }
    }

    // 切换模型的排除状态
    function toggleModelExclusion(channelId: number, model: string) {
        const exclusion = channelExclusions.value.find(e => e.channelId === channelId)
        if (exclusion) {
            const index = exclusion.excludedModels.indexOf(model)
            if (index === -1) {
                exclusion.excludedModels.push(model)
            } else {
                exclusion.excludedModels.splice(index, 1)
            }
        } else {
            channelExclusions.value.push({ channelId, excludedModels: [model] })
        }
    }

    // 检查模型是否被排除
    function isModelExcluded(channelId: number, model: string): boolean {
        const exclusion = channelExclusions.value.find(e => e.channelId === channelId)
        return exclusion?.excludedModels.includes(model) || false
    }

    // 检测渠道中重复的目标模型（用于冲突检测）
    interface DuplicateInfo {
        targetModel: string
        sourceModels: string[]
    }

    function detectDuplicateTargets(upstreamModels: string[], excludedModels: string[] = []): DuplicateInfo[] {
        const excludedSet = new Set(excludedModels)
        const targetToSources: Record<string, string[]> = {}

        for (const model of upstreamModels) {
            if (excludedSet.has(model)) continue

            const rule = rules.value.find(r => r.sourceModel === model)
            if (rule) {
                if (!targetToSources[rule.targetModel]) {
                    targetToSources[rule.targetModel] = []
                }
                targetToSources[rule.targetModel]!.push(model)
            }
        }

        // 返回有多个源模型映射到同一目标的情况
        return Object.entries(targetToSources)
            .filter(([_, sources]) => sources.length > 1)
            .map(([targetModel, sourceModels]) => ({ targetModel, sourceModels }))
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

    // 自动处理所有规则（基于当前 targetModel 进行处理，而不是 sourceModel）
    function autoProcessRules() {
        for (const rule of rules.value) {
            rule.targetModel = applyProcessRules(rule.targetModel)
        }
    }

    // 导出规则为 JSON
    function exportRules(): string {
        const exportData = {
            version: 1,
            exportTime: new Date().toISOString(),
            rules: rules.value,
            customReplaceRules: customReplaceRules.value,
            processConfig: processConfig.value
        }
        return JSON.stringify(exportData, null, 2)
    }

    // 下载导出的规则文件
    function downloadRules() {
        const data = exportRules()
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mapping-rules-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // 导入规则
    function importRules(jsonString: string, mode: 'append' | 'overwrite' = 'overwrite'): { success: boolean; message: string } {
        try {
            const data = JSON.parse(jsonString)

            // 验证数据格式
            if (!data.rules || !Array.isArray(data.rules)) {
                return { success: false, message: '无效的规则文件：缺少 rules 数组' }
            }

            // 验证规则格式
            for (const rule of data.rules) {
                if (typeof rule.sourceModel !== 'string' || typeof rule.targetModel !== 'string') {
                    return { success: false, message: '无效的规则格式：规则必须包含 sourceModel 和 targetModel' }
                }
            }

            if (mode === 'overwrite') {
                // 覆盖模式：清空现有规则
                rules.value = data.rules
            } else {
                // 追加模式：合并规则，已存在的不添加
                for (const rule of data.rules) {
                    if (!hasRule(rule.sourceModel)) {
                        rules.value.push(rule)
                    }
                }
            }

            // 导入自定义替换规则（如果有）
            if (data.customReplaceRules && Array.isArray(data.customReplaceRules)) {
                if (mode === 'overwrite') {
                    customReplaceRules.value = data.customReplaceRules.map((r: any) => ({
                        ...r,
                        id: r.id || generateId() // 确保有 id
                    }))
                } else {
                    for (const rule of data.customReplaceRules) {
                        // 检查是否已存在相同的规则（相同的 search 和 replace）
                        const exists = customReplaceRules.value.some(
                            (r) => r.search === rule.search && r.replace === rule.replace
                        )
                        if (!exists) {
                            customReplaceRules.value.push({
                                ...rule,
                                id: generateId()
                            })
                        }
                    }
                }
            }

            // 导入处理配置（如果有，仅在覆盖模式下）
            if (mode === 'overwrite' && data.processConfig) {
                processConfig.value = {
                    ...processConfig.value,
                    ...data.processConfig
                }
            }

            return {
                success: true,
                message: `成功导入 ${data.rules.length} 条规则`
            }
        } catch (error) {
            return { success: false, message: '解析 JSON 失败：' + (error as Error).message }
        }
    }

    // 从渠道列表导入重定向配置
    // 服务器 model_mapping 格式: {"重定向模型名": "原模型名"}
    function importFromChannels(channels: Channel[]): { imported: number; skipped: number } {
        let imported = 0
        let skipped = 0

        for (const channel of channels) {
            if (!channel.model_mapping) continue

            try {
                // 解析服务器的 model_mapping
                const mapping: Record<string, string> = JSON.parse(channel.model_mapping)

                for (const [targetModel, sourceModel] of Object.entries(mapping)) {
                    // 检查是否已存在该源模型的规则
                    if (hasRule(sourceModel)) {
                        skipped++
                    } else {
                        addRule(sourceModel, targetModel)
                        imported++
                    }
                }
            } catch (e) {
                console.warn(`解析渠道 ${channel.name} 的 model_mapping 失败:`, e)
            }
        }

        return { imported, skipped }
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
        channelExclusions,
        loading,
        loaded,
        saving,
        loadFromServer,
        saveToServer,
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
        customRuleCount,
        exportRules,
        downloadRules,
        importRules,
        getChannelExclusion,
        setChannelExclusion,
        toggleModelExclusion,
        isModelExcluded,
        detectDuplicateTargets,
        importFromChannels
    }
})
