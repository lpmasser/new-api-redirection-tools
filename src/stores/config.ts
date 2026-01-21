import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
    // 状态
    const baseUrl = ref('')  // 生产环境使用
    const token = ref('')
    const userId = ref('')

    // 验证配置是否完整
    function isConfigValid(): boolean {
        return !!(token.value && userId.value)
    }

    // 更新配置
    function updateConfig(newBaseUrl: string, newToken: string, newUserId: string) {
        baseUrl.value = newBaseUrl
        token.value = newToken
        userId.value = newUserId
    }

    return {
        baseUrl,
        token,
        userId,
        isConfigValid,
        updateConfig
    }
}, {
    persist: true
})
