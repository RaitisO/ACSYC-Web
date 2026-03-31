import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/public/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/public/RegisterView.vue'),
    },
    {
      path: '/verify/:token',
      name: 'verify',
      component: () => import('../views/public/VerificationView.vue'),
    },
    {
      path: '/register/success',
      name: 'register-success',
      component: () => import('../views/public/RegistrationSuccessView.vue'),
    },
    {
      path: '/activate/:token',
      name: 'activate',
      component: () => import('../views/auth/ActivationView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
  ],
})

export default router
