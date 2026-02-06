import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ChannelExclusion, MappingRule } from '../../api/types'
import { createMappingPersistence } from './persistence'
import {
    addCustomRule as addCustomRuleDomain,
    addRule as addRuleDomain,
    autoProcessRules as autoProcessRulesDomain,
    clearRules as clearRulesDomain,
    detectDuplicateTargets as detectDuplicateTargetsDomain,
    generateChannelConfig as generateChannelConfigDomain,
    generateId,
    getChannelExclusion as getChannelExclusionDomain,
    getTargetModel as getTargetModelDomain,
    hasRule as hasRuleDomain,
    isModelExcluded as isModelExcludedDomain,
    removeCustomRule as removeCustomRuleDomain,
    removeRule as removeRuleDomain,
    setChannelExclusion as setChannelExclusionDomain,
    toggleModelExclusion as toggleModelExclusionDomain,
    updateCustomRule as updateCustomRuleDomain,
    updateTargetModel as updateTargetModelDomain
} from './rules'
import { createMappingTransfer } from './transfer'
import {
    type CustomReplaceRule,
    DEFAULT_PROCESS_CONFIG,
    type ProcessRuleConfig,
    type SyncMode
} from './types'

export const useMappingStore = defineStore('mapping', () => {
    // 状态
    const rules = ref<MappingRule[]>([])
    const syncMode = ref<SyncMode>('append')
    const processConfig = ref<ProcessRuleConfig>({ ...DEFAULT_PROCESS_CONFIG })
    const customReplaceRules = ref<CustomReplaceRule[]>([])
    const channelExclusions = ref<ChannelExclusion[]>([])

    // 加载状态
    const loading = ref(false)
    const loaded = ref(false)
    const saving = ref(false)

    // 映射规则
    // 添加一条 source -> target 映射规则。
    function addRule(sourceModel: string, targetModel: string = ''): void {
        addRuleDomain(rules.value, sourceModel, targetModel)
    }

    // 删除指定 sourceModel 的映射规则。
    function removeRule(sourceModel: string): void {
        removeRuleDomain(rules.value, sourceModel)
    }

    // 更新指定 sourceModel 的目标模型名。
    function updateTargetModel(sourceModel: string, targetModel: string): void {
        updateTargetModelDomain(rules.value, sourceModel, targetModel)
    }

    // 判断指定 sourceModel 是否已配置映射。
    function hasRule(sourceModel: string): boolean {
        return hasRuleDomain(rules.value, sourceModel)
    }

    // 获取指定 sourceModel 当前对应的 targetModel。
    function getTargetModel(sourceModel: string): string | undefined {
        return getTargetModelDomain(rules.value, sourceModel)
    }

    // 清空全部映射规则。
    function clearRules(): void {
        rules.value = clearRulesDomain()
    }

    // 生成渠道同步所需的 models 与 model_mapping。
    function generateChannelConfig(
        upstreamModels: string[],
        excludedModels: string[] = []
    ): { models: string; modelMapping: string } {
        return generateChannelConfigDomain(rules.value, upstreamModels, excludedModels)
    }

    // 检测某渠道下 targetModel 冲突（多源同目标）。
    function detectDuplicateTargets(
        upstreamModels: string[],
        excludedModels: string[] = []
    ) {
        return detectDuplicateTargetsDomain(rules.value, upstreamModels, excludedModels)
    }

    // 自定义规则
    // 新增一条自定义替换规则。
    function addCustomRule(search: string = '', replace: string = ''): void {
        addCustomRuleDomain(customReplaceRules.value, search, replace, generateId)
    }

    // 删除指定 ID 的自定义替换规则。
    function removeCustomRule(id: string): void {
        removeCustomRuleDomain(customReplaceRules.value, id)
    }

    // 按 ID 更新自定义替换规则的部分字段。
    function updateCustomRule(id: string, updates: Partial<CustomReplaceRule>): void {
        updateCustomRuleDomain(customReplaceRules.value, id, updates)
    }

    // 按当前 processConfig 批量处理全部 targetModel。
    function autoProcessRules(): void {
        autoProcessRulesDomain(rules.value, processConfig.value, customReplaceRules.value)
    }

    // 渠道排除
    // 获取指定渠道的排除模型列表。
    function getChannelExclusion(channelId: number): string[] {
        return getChannelExclusionDomain(channelExclusions.value, channelId)
    }

    // 覆盖设置指定渠道的排除模型列表。
    function setChannelExclusion(channelId: number, excludedModels: string[]): void {
        setChannelExclusionDomain(channelExclusions.value, channelId, excludedModels)
    }

    // 切换指定模型在渠道中的排除状态。
    function toggleModelExclusion(channelId: number, model: string): void {
        toggleModelExclusionDomain(channelExclusions.value, channelId, model)
    }

    // 判断指定模型在渠道中是否处于排除状态。
    function isModelExcluded(channelId: number, model: string): boolean {
        return isModelExcludedDomain(channelExclusions.value, channelId, model)
    }

    // 数据传输（导入/导出）
    const transfer = createMappingTransfer(
        {
            rules,
            customReplaceRules,
            processConfig
        },
        {
            hasRule,
            addRule,
            generateId
        }
    )

    // 持久化
    const persistence = createMappingPersistence({
        rules,
        syncMode,
        processConfig,
        customReplaceRules,
        channelExclusions,
        loading,
        loaded,
        saving
    })

    // 暴露给视图层的“加载远端数据”入口。
    const loadFromServer = persistence.loadFromServer
    // 暴露给视图层的“手动触发保存”入口。
    const saveToServer = persistence.saveToServer

    // 导出当前规则快照为 JSON 文本。
    const exportRules = transfer.exportRules
    // 下载当前规则快照为本地文件。
    const downloadRules = transfer.downloadRules
    // 导入规则文件到当前 store。
    const importRules = transfer.importRules
    // 从渠道 model_mapping 导入规则。
    const importFromChannels = transfer.importFromChannels

    // 计算属性
    const ruleCount = computed(() => rules.value.length)
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
