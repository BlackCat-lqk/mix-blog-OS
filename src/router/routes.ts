import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Desktop/IndexView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login/PageView.vue'),
  },
  {
    path: '/403',
    name: 'error-403',
    component: () => import('@/views/Error/IndexView.vue'),
    props: { code: 403 },
  },
  {
    path: '/404',
    name: 'error-404',
    component: () => import('@/views/Error/IndexView.vue'),
    props: { code: 404 },
  },
  {
    path: '/500',
    name: 'error-500',
    component: () => import('@/views/Error/IndexView.vue'),
    props: { code: 500 },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

export default routes
