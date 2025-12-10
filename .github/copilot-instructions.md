# ACSYC-Web Copilot Instructions

## Project Architecture Overview

**Tech Stack**: Vue 3 (Composition API) + TypeScript + Vite + Pinia + Vue Router

**Core Purpose**: Multi-role educational platform managing users (Admin, Teacher, Student, Parent), lessons scheduling, and connections between users.

### Key Architecture Decisions

1. **Role-Based Dashboard Pattern**: Single dashboard view (`DashboardView.vue`) conditionally renders role-specific components via `v-if="user.role === 'admin'"` etc. See `src/views/DashboardView.vue` for pattern. User data stored in localStorage from login response.

2. **Backend Integration**: All API calls use `fetch('http://localhost:8080/api/*')`. Key endpoints: `/api/health` (App.vue), `/api/profile`, `/api/logout`. Backend runs on `localhost:8080`.

3. **State Management**: Pinia stores for global state (see `src/stores/counter.ts` template). Currently minimal usage - most component state is local refs in `<script setup>`.

4. **Component Structure**: 
   - Page views in `src/views/` (layout containers)
   - Reusable components in `src/components/` (TomSelect for dropdowns, ProfileSection, NavigationBar)
   - Dashboard-specific role components in `src/components/dashboard/` (AdminDashboard, TeacherDashboard, StudentDashboard, ParentDashboard)

## Critical Developer Workflows

### Build & Run Commands
- `npm run dev` - Hot-reload development server (Vite)
- `npm run build` - Production build + type-check
- `npm run type-check` - Run vue-tsc for TypeScript validation
- `npm run lint` - ESLint with auto-fix
- `npm run test:unit` - Run Vitest tests
- `npm run test:e2e:dev` - Run Cypress against dev server (recommended for testing)

### Testing Setup
- **Unit Tests**: Vitest (`src/**/__tests__/*.spec.ts`), jsdom environment
- **E2E Tests**: Cypress (`cypress/e2e/`, `cypress/support/`)
- Test commands run build + type-check first (`npm run build` does this via `run-p`)

### Debug Points
- Vue DevTools required for development (install in your browser)
- Backend health check runs on App mount to `http://localhost:8080/api/health`
- localStorage contains user data after login - critical for role detection

## Project-Specific Patterns & Conventions

### 1. API Response Handling
Standardized fetch pattern with error handling:
```typescript
const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/endpoint', {
      credentials: 'include',  // Include for session-based auth
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Request failed')
    }
    return await response.json()
  } catch (error) {
    console.error('Error:', error)
  }
}
```
**Key**: Check `response.ok` before parsing, extract error messages from response JSON.

### 2. Component Data & Forms
Use `ref()` for form state in `<script setup>`, `watch()` for reactivity, `onMounted()` for API calls:
```typescript
const formData = ref({ name: '', email: '' })
const isLoading = ref(false)
const message = ref('')

const submitForm = async () => {
  isLoading.value = true
  // API call
  message.value = 'Success' // User feedback
  setTimeout(() => message.value = '', 3000) // Auto-clear
}

onMounted(() => {
  // Fetch initial data
})
```

### 3. Form Dropdowns
Use `TomSelect.vue` component for styled multi-option selects:
```vue
<TomSelect 
  id="unique-id" 
  v-model="selectedValue"
  :options="[{ value: '1', text: 'Option 1' }]" 
  placeholder="Select..."
/>
```
Custom wrapper around tom-select library with `update:modelValue` emission.

### 4. Role-Based Component Rendering
Conditional rendering by user role (set in localStorage during login):
```vue
<AdminDashboard v-if="user.role === 'admin'" />
<TeacherDashboard v-else-if="user.role === 'teacher'" />
<!-- etc -->
```
User object structure: `{ first_name, last_name, email, role, id }`

### 5. Calendar Integration
FullCalendar v6 for Vue3 with dayGrid, timeGrid, interaction plugins. Reference: `AdminDashboard.vue` (2995 lines - complex example with lesson management, drag-drop, modal interactions).

## TypeScript & Type Conventions

- **Path alias**: `@/` maps to `src/` (tsconfig.json)
- **Type definitions**: `src/types/` for domain models (e.g., `calendar.ts` has Lesson, TimeSlot, DropdownData interfaces)
- Vue components use `<script setup lang="ts">` with explicit Props/Emits types
- Global types auto-imported via `env.d.ts`

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.vue` | Root layout, backend health check, navbar conditional rendering |
| `src/router/index.ts` | Route definitions (home, login, register, dashboard) with lazy loading |
| `src/views/DashboardView.vue` | Dashboard wrapper, user auth check, role-based component dispatch |
| `src/components/dashboard/*.vue` | Role-specific dashboards (each 500-3000 lines) |
| `src/types/calendar.ts` | Lesson, TimeSlot, DropdownData interface definitions |
| `src/components/TomSelect.vue` | Reusable dropdown component, lifecycle-managed |
| `src/components/ProfileSection.vue` | User profile CRUD example (API + form pattern) |
| `vite.config.ts` | Vite + Vue plugin config, ngrok host allowed |

## External Dependencies of Note

- **@fullcalendar/vue3** - Calendar rendering with multiple plugins
- **tom-select** - Dropdown library (custom Vue wrapper in TomSelect.vue)
- **pinia** - State management (minimal usage currently)
- **cypress** - E2E testing
- **vitest** - Unit testing
- **eslint** with Vue/TS plugins - Linting

## Git & CI Context

Branch: `main` | Owner: RaitisO | Node requirements: `^20.19.0 || >=22.12.0`

---

**When adding features**: Follow the component patterns in existing dashboards, use Pinia if managing complex shared state, always include type safety with TypeScript, and test API integrations against the actual backend at `localhost:8080`.
