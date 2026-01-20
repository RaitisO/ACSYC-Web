# ACSYC Copilot Instructions

## System Architecture

**ACSYC** is a full-stack educational platform: Vue 3 TypeScript frontend (`ACSYC-Web/`, port 5173) + Go/Gin backend (`ACSYC-server/`, port 8080), SQLite database. Four user roles: Admin, Teacher, Student, Parent.

### Critical Data Flows

1. **Auth Flow**: Register/Login → session cookie stored on backend → `localStorage.user` (frontend) → Dashboard reads role → role-based component renders. Session validated on dashboard mount via `/api/profile` GET.

2. **Lesson Management**: Create lesson in Admin/Teacher dashboard → POST `/api/lessons` → backend writes to SQLite → FullCalendar refetch → calendar re-renders with teacher color (golden angle HSL hue algorithm).

3. **User Connections**: Initiator requests → `/api/connect` → creates pending record → receiver confirms → updates status. Admins can force-connect via `/api/admin/users/:id/connect` without approval.

## Frontend: Vue 3 + TypeScript + Vite

### Setup & Commands
```bash
npm install                 # Node ^20.19.0 || >=22.12.0
npm run dev                 # Vite hot-reload, localhost:5173
npm run build               # Type-check + production bundle
npm run type-check          # vue-tsc validation
npm run test:unit           # Vitest + jsdom
npm run test:e2e:dev        # Cypress against dev server
```

### Component Architecture
- **Views** (`src/views/`): Page layouts (HomeView, LoginView, DashboardView, RegisterView)
- **Dashboard** (`src/components/dashboard/`): Role-specific components:
  - `AdminDashboard.vue` (3000+ lines): Lessons calendar, user management, connections, miro boards, admin notes
  - `TeacherDashboard.vue`, `StudentDashboard.vue`, `ParentDashboard.vue`: Role-specific features
- **Reusable** (`src/components/`): TomSelect (dropdown), ProfileSection, NavigationBar, ConnectionsSection

### Key Patterns

**API Calls with Session Auth**:
```typescript
const response = await fetch('http://localhost:8080/api/lessons', {
  credentials: 'include',  // Sends session cookie (CRITICAL)
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
if (!response.ok) throw new Error((await response.json()).error)
const data = await response.json()
```

**Form State & Submission**:
```typescript
const form = ref({ teacher: '', student: '', start: '', end: '' })
const isLoading = ref(false)
const submitForm = async () => {
  isLoading.value = true
  try {
    await fetch('...', { credentials: 'include', body: JSON.stringify(form.value) })
  } finally {
    isLoading.value = false  // Always clear loading state
  }
}
onMounted(() => { /* initial data fetch */ })
```

**Role-Based Component Rendering**:
```vue
<AdminDashboard v-if="user.role === 'admin'" />
<TeacherDashboard v-else-if="user.role === 'teacher'" />
<StudentDashboard v-else-if="user.role === 'student'" />
<ParentDashboard v-else-if="user.role === 'parent'" />
```
User object from localStorage: `{ id, first_name, last_name, email, role }`

**Dropdown Component**:
```vue
<TomSelect id="teacher-select" v-model="lesson.teacher" 
  :options="teachers.map(t => ({ value: t.id, text: t.first_name }))"
  placeholder="Select teacher..." />
```

### Calendar & Lessons
- **Library**: FullCalendar v6 with dayGrid, timeGrid, interaction plugins
- **Lesson Colors**: Teacher-specific via `(teacherId * 137.5) % 360` for unique HSL hue
- **Implementation**: AdminDashboard.vue handles create, edit, delete, drag-drop

## Backend: Go + Gin + SQLite

### Setup & Run
```bash
cd ACSYC-server
go run main.go              # Starts 0.0.0.0:8080
# SQLite schema auto-created via database/schema.sql
```

### Architecture
- **main.go** (1544 lines): Router, 30+ endpoint handlers, session middleware, CORS
- **models/**: Data structures (User, Lesson, Connection, AdminNote, etc.)
- **database/**: Repository pattern (UserRepository, LessonRepository, ConnectionRepository, etc.)
- **tutoring.db**: SQLite file

### API Endpoints (Session-Protected Routes)

**Public**:
- `POST /api/register` - User registration (validates role: student|parent|teacher|admin)
- `POST /api/login` - Sets session cookie
- `GET /api/health` - Connectivity check
- `POST /api/logout` - Clears session

**Protected** (requires `authMiddleware()` + valid session):
- `GET /api/profile` - Current user info
- `PUT /api/profile` - Update user profile
- `PUT /api/change-password` - Change password

**Lessons**:
- `GET /api/lessons` - All user's lessons (role-filtered)
- `POST /api/lessons` - Create lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `GET /api/dropdown-data` - Subjects, teachers, students (for forms)

**Connections**:
- `GET /api/connections` - User's confirmed connections
- `GET /api/pending-connections` - Pending connection requests
- `POST /api/connections` - Confirm/deny connection
- `POST /api/connect` - Request connection with 4-char code
- `GET /api/connection-code` - Generate new 4-char code

**Admin Features**:
- `POST /api/admin/users/:id/connect` - Admin force-connect users
- `GET /api/users` - All users (admin only)
- `GET /api/students/:studentId/miro-boards` - Collaborative boards
- `POST /api/students/:studentId/miro-boards` - Add miro board
- `DELETE /api/students/:studentId/miro-boards/:boardId` - Remove board
- `GET/POST/DELETE /api/teacher-colors/:teacherId` - Teacher calendar colors
- `GET/POST/DELETE /api/admin-notes/:parentId` - Admin notes on parents

### Key Implementation Details

**Session Middleware**:
```go
func authMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    session := sessions.Default(c)
    if auth, ok := session.Get("authenticated").(bool); !ok || !auth {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
      c.Abort()
      return
    }
    c.Next()
  }
}
```

**Repository Pattern**:
```go
type UserRepository struct{ db *sql.DB }
func (r *UserRepository) GetUserByID(id int) (*User, error) {
  query := `SELECT id, email, ... FROM users WHERE id = ?`
  // Parameterized queries for SQL injection protection
}
```

**CORS & Session Credentials**:
- Allowed origins: `http://127.0.0.1:5173`, `http://localhost:5173`
- Header: `Access-Control-Allow-Credentials: true` (required for cookies)
- Frontend must send `credentials: 'include'` in fetch

### Database Schema
- **users**: id, email, password_hash, first_name, last_name, phone, date_of_birth, role
- **lessons**: teacher_id, student_id, subject_id, start_time, end_time, is_recurring, status
- **user_connections**: user1_id, user2_id, connection_type (teacher-student|parent-student), status
- **connection_codes**: 4-char codes for self-serve linking (expires_at)
- **student_miro_boards**: Collaborative board URLs per student
- **teacher_colors**: Color assignments for lesson calendar
- **admin_notes**: Admin observations on parents
- **subjects**: List of subjects (referenced by lessons)

## Development Workflow

**Adding a Feature**:
1. Backend: Create model struct → add repository method → add Gin route handler
2. Frontend: Create API fetch call with session cookie → handle response in component
3. Test integration: `npm run dev` (frontend) + `go run main.go` (backend)
4. Validate: `npm run type-check` (no TS errors)

**Debugging Tips**:
- Backend: Log to console in terminal; check SQL queries in schema.sql for table structure
- Frontend: Vue DevTools extension, browser Network tab (verify `credentials: include`, session cookie)
- Session issues: DevTools → Application → Cookies → delete `acsyc-session` → reload → re-login

**Common Issues**:
- 401 Unauthorized: Session cookie missing or expired. Check `credentials: 'include'` in fetch, verify backend sets `Access-Control-Allow-Credentials: true`
- 500 on API call: Backend error. Check terminal output for SQL/handler errors
- Type mismatch: Run `npm run type-check` to catch TS errors before runtime

## TypeScript & Files
- **Path alias**: `@/` → `src/`
- **env.d.ts**: Global type declarations
- **src/types/calendar.ts**: Lesson, TimeSlot, DropdownData interfaces
- **tsconfig.json**: Vue 3, DOM lib, bundler module resolution

## Key Files Reference

| Path | Purpose |
|------|---------|
| `ACSYC-Web/src/views/DashboardView.vue` | Auth check, role-based component dispatch |
| `ACSYC-Web/src/components/dashboard/AdminDashboard.vue` | Lesson calendar, user management, admin features |
| `ACSYC-Web/src/components/TomSelect.vue` | Dropdown wrapper around tom-select library |
| `ACSYC-Web/src/types/calendar.ts` | Domain type definitions |
| `ACSYC-server/main.go` | All endpoints, middleware, request handlers |
| `ACSYC-server/database/schema.sql` | SQLite schema with indexes |
| `ACSYC-server/models/user.go` | User struct, password hashing (bcrypt) |
| `ACSYC-server/database/user_repository.go` | User CRUD operations |

## External Dependencies

**Frontend**: @fullcalendar/vue3, tom-select, pinia, vue-router, vitest, cypress, eslint  
**Backend**: gin-gonic/gin (HTTP), gorilla/sessions (auth), mattn/go-sqlite3 (database)  
**Both**: Go 1.24+, Node 20.19+ | 22.12+
