import type { Ref } from 'vue'
import type { Channel, MappingRule } from '../../api/types'
import type {
    CustomReplaceRule,
    ExportedMappingData,
    ImportFromChannelsResult,
    ImportRulesResult,
    ProcessRuleConfig,
    SyncMode
} from './types'

interface MappingTransferState {
    rules: Ref<MappingRule[]>
    customReplaceRules: Ref<CustomReplaceRule[]>
    processConfig: Ref<ProcessRuleConfig>
}

interface MappingTransferDependencies {
    hasRule: (sourceModel: string) => boolean
    addRule: (sourceModel: string, targetModel?: string) => void
    generateId: () => string
}

interface ImportRuleRaw {
    sourceModel?: unknown
    targetModel?: unknown
}

interface ImportCustomRuleRaw {
    id?: unknown
    priority?: unknown
    search?: unknown
    replace?: unknown
    enabled?: unknown
}

interface ImportPayloadRaw {
    rules?: ImportRuleRaw[]
    customReplaceRules?: ImportCustomRuleRaw[]
    processConfig?: Partial<Record<keyof ProcessRuleConfig, unknown>>
}

interface ChannelRuleCandidate {
    sourceModel: string
    targetModel: string
}

// 过滤并规范化导入数据中的 processConfig 字段。
function normalizeProcessConfig(
    raw: Partial<Record<keyof ProcessRuleConfig, unknown>>
): Partial<ProcessRuleConfig> {
    const next: Partial<ProcessRuleConfig> = {}

    if (typeof raw.formatModelName === 'boolean') {
        next.formatModelName = raw.formatModelName
    }
    if (typeof raw.enableCustomRules === 'boolean') {
        next.enableCustomRules = raw.enableCustomRules
    }
    if (typeof raw.toLowerCase === 'boolean') {
        next.toLowerCase = raw.toLowerCase
    }

    return next
}

// 将导入的自定义规则对象规范化为内部可用结构。
function normalizeCustomRule(
    raw: ImportCustomRuleRaw,
    fallbackPriority: number,
    generateId: () => string,
    preferExistingId: boolean
): CustomReplaceRule {
    return {
        id: preferExistingId && typeof raw.id === 'string' && raw.id
            ? raw.id
            : generateId(),
        priority: typeof raw.priority === 'number' && Number.isFinite(raw.priority)
            ? raw.priority
            : fallbackPriority,
        search: typeof raw.search === 'string' ? raw.search : '',
        replace: typeof raw.replace === 'string' ? raw.replace : '',
        enabled: typeof raw.enabled === 'boolean' ? raw.enabled : true
    }
}

// 解析并清洗渠道 models 列表（去空、去重，保留首次出现顺序）。
function parseChannelModels(models: string): string[] {
    const uniqueModels = new Set<string>()
    for (const model of models.split(',').map(item => item.trim())) {
        if (!model) continue
        if (uniqueModels.has(model)) continue
        uniqueModels.add(model)
    }
    return Array.from(uniqueModels)
}

// 解析并清洗渠道 model_mapping（target -> source）。
function parseChannelMapping(channel: Channel): Record<string, string> {
    const mapping: Record<string, string> = {}
    if (!channel.model_mapping) return mapping

    try {
        const rawMapping = JSON.parse(channel.model_mapping) as Record<string, unknown>
        for (const [targetModel, sourceModel] of Object.entries(rawMapping)) {
            if (typeof sourceModel !== 'string') continue

            const normalizedTarget = targetModel.trim()
            const normalizedSource = sourceModel.trim()
            if (!normalizedTarget || !normalizedSource) continue

            mapping[normalizedTarget] = normalizedSource
        }
    } catch (error) {
        console.warn(`解析渠道 ${channel.name} 的 model_mapping 失败:`, error)
    }

    return mapping
}

// 从渠道的 models + model_mapping 组合出完整候选规则：
// 1) 以 models 为基准集合；2) 套用 mapping 覆盖 source；3) 补齐 mapping 中缺失于 models 的条目。
function collectChannelRuleCandidates(channel: Channel): ChannelRuleCandidate[] {
    const models = parseChannelModels(channel.models || '')
    const modelSet = new Set(models)
    const mapping = parseChannelMapping(channel)
    const candidates: ChannelRuleCandidate[] = []

    // 1) models 是“当前实际启用模型”全集。
    for (const targetModel of models) {
        candidates.push({
            sourceModel: mapping[targetModel] ?? targetModel,
            targetModel
        })
    }

    // 2) 补齐 models 中没有、但 mapping 中存在的旧条目。
    for (const [targetModel, sourceModel] of Object.entries(mapping)) {
        if (modelSet.has(targetModel)) continue
        candidates.push({ sourceModel, targetModel })
    }

    return candidates
}

// 创建 mapping 的导入/导出能力。
export function createMappingTransfer(
    state: MappingTransferState,
    dependencies: MappingTransferDependencies
) {
    // 导出当前规则、处理配置和自定义规则为 JSON 文本。
    function exportRules(): string {
        const exportData: ExportedMappingData = {
            version: 1,
            exportTime: new Date().toISOString(),
            rules: state.rules.value,
            customReplaceRules: state.customReplaceRules.value,
            processConfig: state.processConfig.value
        }
        return JSON.stringify(exportData, null, 2)
    }

    // 触发浏览器下载当前导出的规则文件。
    function downloadRules(): void {
        const data = exportRules()
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')

        anchor.href = url
        anchor.download = `mapping-rules-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
    }

    // 导入规则文件，支持 append/overwrite 两种模式。
    function importRules(
        jsonString: string,
        mode: SyncMode = 'overwrite'
    ): ImportRulesResult {
        try {
            const data = JSON.parse(jsonString) as ImportPayloadRaw

            if (!Array.isArray(data.rules)) {
                return { success: false, message: '无效的规则文件：缺少 rules 数组' }
            }

            const parsedRules: MappingRule[] = []
            for (const rule of data.rules) {
                if (typeof rule.sourceModel !== 'string' || typeof rule.targetModel !== 'string') {
                    return {
                        success: false,
                        message: '无效的规则格式：规则必须包含 sourceModel 和 targetModel'
                    }
                }
                parsedRules.push({
                    sourceModel: rule.sourceModel,
                    targetModel: rule.targetModel
                })
            }

            if (mode === 'overwrite') {
                state.rules.value = parsedRules
            } else {
                for (const rule of parsedRules) {
                    if (!dependencies.hasRule(rule.sourceModel)) {
                        state.rules.value.push(rule)
                    }
                }
            }

            if (Array.isArray(data.customReplaceRules)) {
                if (mode === 'overwrite') {
                    state.customReplaceRules.value = data.customReplaceRules.map((rule, index) =>
                        normalizeCustomRule(
                            rule,
                            index + 1,
                            dependencies.generateId,
                            true
                        )
                    )
                } else {
                    for (const rule of data.customReplaceRules) {
                        const normalized = normalizeCustomRule(
                            rule,
                            state.customReplaceRules.value.length + 1,
                            dependencies.generateId,
                            false
                        )

                        const exists = state.customReplaceRules.value.some(
                            item => item.search === normalized.search && item.replace === normalized.replace
                        )
                        if (!exists) {
                            state.customReplaceRules.value.push(normalized)
                        }
                    }
                }
            }

            if (mode === 'overwrite' && data.processConfig) {
                state.processConfig.value = {
                    ...state.processConfig.value,
                    ...normalizeProcessConfig(data.processConfig)
                }
            }

            return {
                success: true,
                message: `成功导入 ${parsedRules.length} 条规则`
            }
        } catch (error) {
            return {
                success: false,
                message: '解析 JSON 失败：' + (error as Error).message
            }
        }
    }

    // 从渠道配置提取并导入规则（包含未重定向模型），统计导入与跳过数量。
    function importFromChannels(channels: Channel[]): ImportFromChannelsResult {
        let imported = 0
        let skipped = 0

        for (const channel of channels) {
            const candidates = collectChannelRuleCandidates(channel)
            for (const candidate of candidates) {
                if (dependencies.hasRule(candidate.sourceModel)) {
                    skipped++
                } else {
                    dependencies.addRule(candidate.sourceModel, candidate.targetModel)
                    imported++
                }
            }
        }

        return { imported, skipped }
    }

    return {
        exportRules,
        downloadRules,
        importRules,
        importFromChannels
    }
}
