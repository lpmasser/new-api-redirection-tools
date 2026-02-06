import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchConfig, saveConfig } from '../api/backend'

export const useConfigStore = defineStore('config', () => {
    // 状态
    const baseUrl = ref('')
    const token = ref('')
    const userId = ref('')
    const loading = ref(false)
    const loaded = ref(false)

    // 验证配置是否完整
    function isConfigValid(): boolean {
        return !!(baseUrl.value.trim() && token.value.trim() && userId.value.trim())
    }

    // 更新配置
    function updateConfig(newBaseUrl: string, newToken: string, newUserId: string) {
        baseUrl.value = newBaseUrl
        token.value = newToken
        userId.value = newUserId
    }

    // 从服务器加载配置
    async function loadFromServer(force: boolean = false): Promise<void> {
        if (loading.value) return
        if (loaded.value && !force) return

        loading.value = true
        try {
            const config = await fetchConfig()
            const upstream = config.upstreamConfig

            baseUrl.value = typeof upstream?.baseUrl === 'string' ? upstream.baseUrl : ''
            token.value = typeof upstream?.token === 'string' ? upstream.token : ''
            userId.value = typeof upstream?.userId === 'string' ? upstream.userId : ''
            loaded.value = true
        } finally {
            loading.value = false
        }
    }

    // 保存配置到服务器
    async function saveToServer(): Promise<void> {
        await saveConfig({
            upstreamConfig: {
                baseUrl: baseUrl.value.trim(),
                token: token.value.trim(),
                userId: userId.value.trim()
            }
        })
        loaded.value = true
    }

    return {
        baseUrl,
        token,
        userId,
        loading,
        loaded,
        isConfigValid,
        updateConfig,
        loadFromServer,
        saveToServer
    }
})
