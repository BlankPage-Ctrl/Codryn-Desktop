import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/presentation/views/Workspace.vue'),
        },
        {
            path: '/primary',
            name: 'primary',
            redirect: '/',
        },
        {
            path: '/workspace/:id?',
            name: 'workspace',
            component: () => import('@/presentation/views/Workspace.vue'),
        },
        {
            path: '/test-lab',
            name: 'test-lab',
            component: () => import('@/presentation/views/TestLab.vue'),
        },
    ],
})

export default router
