import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, verifyToken } from '../api/backend'

export const useAuthStore = defineStore('auth', () => {
    // 状态
    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const loading = ref(false)
    const error = ref<string | null>(null)

    // 计算属性
    const isLoggedIn = computed(() => !!token.value)

    // 登录
    async function login(password: string): Promise<boolean> {
        loading.value = true
        error.value = null

        try {
            const response = await apiLogin(password)
            if (response.success && response.data?.token) {
                token.value = response.data.token
                localStorage.setItem('auth_token', response.data.token)
                return true
            } else {
                error.value = response.message || '登录失败'
                return false
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : '登录失败'
            return false
        } finally {
            loading.value = false
        }
    }

    // 登出
    function logout() {
        token.value = null
        localStorage.removeItem('auth_token')
    }

    // 验证 Token 是否有效
    async function checkAuth(): Promise<boolean> {
        if (!token.value) {
            return false
        }

        try {
            const response = await verifyToken()
            return response.success
        } catch {
            // Token 无效，清除
            logout()
            return false
        }
    }

    return {
        token,
        loading,
        error,
        isLoggedIn,
        login,
        logout,
        checkAuth
    }
})
