import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
    // 状态
    const baseUrl = ref('')
    const token = ref('')
    const userId = ref('')
    const useProxy = ref(true) // 开发环境下是否使用代理（解决 CORS 问题）

    // 验证配置是否完整
    function isConfigValid(): boolean {
        return !!(baseUrl.value && token.value && userId.value)
    }

    // 更新配置
    function updateConfig(newBaseUrl: string, newToken: string, newUserId: string, newUseProxy: boolean = true) {
        baseUrl.value = newBaseUrl
        token.value = newToken
        userId.value = newUserId
        useProxy.value = newUseProxy
    }

    return {
        baseUrl,
        token,
        userId,
        useProxy,
        isConfigValid,
        updateConfig
    }
}, {
    persist: true
})
