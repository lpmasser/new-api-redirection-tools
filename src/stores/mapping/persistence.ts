import { watch, type Ref } from 'vue'
import type { ChannelExclusion, MappingRule } from '../../api/types'
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
} from '../../api/backend'
import type { CustomReplaceRule, ProcessRuleConfig, SyncMode } from './types'

interface MappingPersistenceState {
    rules: Ref<MappingRule[]>
    syncMode: Ref<SyncMode>
    processConfig: Ref<ProcessRuleConfig>
    customReplaceRules: Ref<CustomReplaceRule[]>
    channelExclusions: Ref<ChannelExclusion[]>
    loading: Ref<boolean>
    loaded: Ref<boolean>
    saving: Ref<boolean>
}

const SAVE_DEBOUNCE_MS = 500

// 创建 mapping 模块的服务端读写与自动保存能力。
export function createMappingPersistence(state: MappingPersistenceState) {
    let saveTimer: ReturnType<typeof setTimeout> | null = null

    // 从后端并行加载规则、配置和排除项并回填到 store 状态。
    async function loadFromServer(): Promise<void> {
        if (state.loading.value) return

        state.loading.value = true
        try {
            const [mappingRulesData, customRulesData, configData, exclusionsData] = await Promise.all([
                fetchMappingRules(),
                fetchCustomRules(),
                fetchConfig(),
                fetchChannelExclusions()
            ])

            state.rules.value = mappingRulesData
            state.channelExclusions.value = exclusionsData
            state.customReplaceRules.value = customRulesData as CustomReplaceRule[]

            if (configData.syncMode === 'append' || configData.syncMode === 'overwrite') {
                state.syncMode.value = configData.syncMode
            }

            if (configData.processConfig) {
                state.processConfig.value = {
                    ...state.processConfig.value,
                    ...configData.processConfig
                }
            }

            state.loaded.value = true
        } catch (error) {
            console.error('Failed to load data from server:', error)
            throw error
        } finally {
            state.loading.value = false
        }
    }

    // 以防抖方式将当前状态保存回后端。
    function saveToServer(): void {
        if (saveTimer) {
            clearTimeout(saveTimer)
        }

        saveTimer = setTimeout(async () => {
            if (state.saving.value) return

            state.saving.value = true
            try {
                await Promise.all([
                    saveMappingRules(state.rules.value),
                    saveCustomRules(state.customReplaceRules.value as BackendCustomRule[]),
                    saveConfig({
                        syncMode: state.syncMode.value,
                        processConfig: state.processConfig.value
                    } as AppConfig),
                    saveChannelExclusions(state.channelExclusions.value)
                ])
            } catch (error) {
                console.error('Failed to save data to server:', error)
            } finally {
                state.saving.value = false
            }
        }, SAVE_DEBOUNCE_MS)
    }

    // 监听关键状态变化，在首次加载完成后自动触发保存。
    watch(
        () => [
            state.rules.value,
            state.customReplaceRules.value,
            state.syncMode.value,
            state.processConfig.value,
            state.channelExclusions.value
        ],
        () => {
            if (state.loaded.value) {
                saveToServer()
            }
        },
        { deep: true }
    )

    return {
        loadFromServer,
        saveToServer
    }
}
