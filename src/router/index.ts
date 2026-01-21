import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/settings'
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('../views/SettingsView.vue')
        },
        {
            path: '/redirect-map',
            name: 'redirect-map',
            component: () => import('../views/RedirectMapView.vue')
        },
        {
            path: '/sync',
            name: 'sync',
            component: () => import('../views/SyncView.vue')
        }
    ]
})

export default router
