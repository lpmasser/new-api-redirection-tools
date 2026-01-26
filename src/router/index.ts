import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/',
            redirect: '/settings'
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('../views/SettingsView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/redirect-map',
            name: 'redirect-map',
            component: () => import('../views/RedirectMapView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sync',
            name: 'sync',
            component: () => import('../views/SyncView.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // 登录页面直接放行
    if (to.name === 'login') {
        // 如果已登录，跳转到首页
        if (authStore.isLoggedIn) {
            next('/')
        } else {
            next()
        }
        return
    }

    // 需要认证的页面
    if (to.meta.requiresAuth !== false) {
        if (!authStore.isLoggedIn) {
            next('/login')
            return
        }

        // 验证 Token 是否有效（首次访问时验证）
        const isValid = await authStore.checkAuth()
        if (!isValid) {
            next('/login')
            return
        }
    }

    next()
})

export default router
