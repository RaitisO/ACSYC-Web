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
      component: () => import('../views/auth/RegisterView.vue'),
    },
    {
      path: '/registration-pending',
      name: 'registration-pending',
      component: () => import('../views/auth/RegistrationPendingView.vue'),
    },
    {
      path: '/register-teacher',
      name: 'register-teacher',
      component: () => import('../views/auth/RegisterTeacherView.vue'),
    },
    {
      path: '/teacher-registered',
      name: 'teacher-registered',
      component: () => import('../views/auth/TeacherRegisteredView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/admin/applications',
      name: 'admin-applications',
      component: () => import('../views/admin/AdminApplicationsView.vue'),
    },
    {
      path: '/test-styles',
      name: 'test-styles',
      component: () => import('../views/TestStylesView.vue'),
    },
  ],
})

export default router
