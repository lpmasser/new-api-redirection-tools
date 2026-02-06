import type { MappingRule } from '../../api/types'

export type SyncMode = 'append' | 'overwrite'

// 自定义替换规则
export interface CustomReplaceRule {
    id: string
    priority: number
    search: string
    replace: string
    enabled: boolean
}

// 自动处理规则配置
export interface ProcessRuleConfig {
    formatModelName: boolean
    enableCustomRules: boolean
    toLowerCase: boolean
}

export interface DuplicateInfo {
    targetModel: string
    sourceModels: string[]
}

export interface ExportedMappingData {
    version: number
    exportTime: string
    rules: MappingRule[]
    customReplaceRules: CustomReplaceRule[]
    processConfig: ProcessRuleConfig
}

export interface ImportRulesResult {
    success: boolean
    message: string
}

export interface ImportFromChannelsResult {
    imported: number
    skipped: number
}

export const DEFAULT_PROCESS_CONFIG: ProcessRuleConfig = {
    formatModelName: false,
    enableCustomRules: false,
    toLowerCase: true
}
