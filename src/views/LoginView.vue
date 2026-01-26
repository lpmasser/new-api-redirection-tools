<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1>API 配置工具</h1>
                <p>请输入访问密码以继续</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label for="password">访问密码</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        placeholder="请输入密码"
                        autocomplete="current-password"
                        :disabled="authStore.loading"
                    />
                </div>

                <div v-if="authStore.error" class="error-message">
                    {{ authStore.error }}
                </div>

                <button 
                    type="submit" 
                    class="login-button"
                    :disabled="authStore.loading || !password"
                >
                    <span v-if="authStore.loading">登录中...</span>
                    <span v-else>登录</span>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')

async function handleLogin() {
    if (!password.value) return

    const success = await authStore.login(password.value)
    if (success) {
        router.push('/')
    }
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    padding: 1rem;
}

.login-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-header h1 {
    color: #fff;
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.login-header p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 500;
}

.form-group input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    color: #fff;
    transition: all 0.2s ease;
}

.form-group input::placeholder {
    color: rgba(255, 255, 255, 0.4);
}

.form-group input:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.error-message {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #fca5a5;
    font-size: 0.875rem;
    text-align: center;
}

.login-button {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    border-radius: 8px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
}

.login-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.login-button:active:not(:disabled) {
    transform: translateY(0);
}

.login-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
