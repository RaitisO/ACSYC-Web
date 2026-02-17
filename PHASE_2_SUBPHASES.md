# Phase 2: Styles Extraction - Subphase Breakdown

## Overview
Extract styles from 18 Vue files into organized CSS files. Breaking into 8 subphases (2 Vue files per subphase) for manageable, verifiable changes.

---

## Subphase Breakdown

### **Subphase 2.1: Dashboard Components - Part 1 (NEXT)**
Extract styles from AdminDashboard + TeacherDashboard

**Files:**
- `src/components/dashboard/AdminDashboard.vue` (4426 lines → ~900+ lines of styles)
- `src/components/dashboard/TeacherDashboard.vue` (1831 lines → ~430+ lines of styles)

**Output File:** `src/styles/views/dashboards.css` (new)

**Styles to Extract:**
- Admin dashboard grid, cards, tables, search, sorting
- User details, connections, quick actions, color picker modal
- Notes modal, Miro board modal
- Teacher dashboard calendar container, legend, modals
- Forms, buttons, checkboxes, radio buttons for lessons
- Modal overlays and positioning
- FullCalendar custom styling (:deep() styles)

**Estimated:**
- Combined styles: ~1300+ lines
- Classes needed: .admin-dashboard, .teacher-dashboard, .modal-*, .user-*, .lesson-*, .calendar-*, etc.

---

### **Subphase 2.2: Dashboard Components - Part 2**
Extract styles from StudentDashboard + ParentDashboard

**Files:**
- `src/components/dashboard/StudentDashboard.vue` (444 lines → ~200+ lines of styles)
- `src/components/dashboard/ParentDashboard.vue` (392 lines → ~250+ lines of styles)

**Output File:** `src/styles/views/dashboards.css` (add to existing from 2.1)

**Styles to Extract:**
- Student dashboard lessons grid, calendar
- Parent dashboard student management, tabs
- Shared modal/button styles already in 2.1

---

### **Subphase 2.3: Auth Views - Part 1 (Alternative Priority)**
Extract styles from LoginView + RegisterView

**Files:**
- `src/views/auth/LoginView.vue` (298 lines → ~150+ lines of styles)
- `src/views/auth/RegisterView.vue` (721 lines → ~300+ lines of styles)

**Output File:** `src/styles/views/auth.css` (new)

**Styles to Extract:**
- Login page layout, form, buttons
- Register page layout, form sections, steps
- Error messages with pending/rejected states
- Form inputs, labels, validation states

---

### **Subphase 2.4: Auth Views - Part 2**
Extract styles from RegisterTeacherView + RegistrationPendingView

**Files:**
- `src/views/auth/RegisterTeacherView.vue` (458 lines → ~200+ lines of styles)
- `src/views/auth/RegistrationPendingView.vue` (255 lines → ~150+ lines of styles)

**Output File:** `src/styles/views/auth.css` (add to existing from 2.3)

---

### **Subphase 2.5: Section Components**
Extract styles from ProfileSection + ConnectionsSection

**Files:**
- `src/components/sections/ProfileSection.vue` (427 lines → ~150+ lines of styles)
- `src/components/sections/ConnectionsSection.vue` (356 lines → ~150+ lines of styles)

**Output File:** `src/styles/components/sections.css` (new)

**Styles to Extract:**
- Profile tabs, form groups, buttons
- Connections code display, request forms
- Messages (success/error)

---

### **Subphase 2.6: Admin & Other Views**
Extract styles from AdminApplicationsView + TeacherRegisteredView

**Files:**
- `src/views/admin/AdminApplicationsView.vue` (581 lines → ~250+ lines of styles)
- `src/views/auth/TeacherRegisteredView.vue` (232 lines → ~100+ lines of styles)

**Output File:** `src/styles/views/admin.css` (new)

---

### **Subphase 2.7: Minor Components & Navigation**
Extract styles from NavigationBar + TomSelect

**Files:**
- `src/components/common/NavigationBar.vue` (188 lines → ~100+ lines of styles)
- `src/components/common/TomSelect.vue` (118 lines → ~50+ lines of styles)

**Output File:** `src/styles/components/navigation.css` (new) + `src/styles/components/form-inputs.css` (new)

---

### **Subphase 2.8: Remaining Small Files**
Extract styles from ErrorBoundary + HomeView + DashboardView

**Files:**
- `src/components/ErrorBoundary.vue` (257 lines → ~50+ lines of styles)
- `src/views/public/HomeView.vue` (139 lines → ~50+ lines of styles)
- `src/views/DashboardView.vue` (212 lines → ~50+ lines of styles)

**Output File:** `src/styles/views/layout.css` (new)

---

## Implementation Steps (per Subphase)

For each subphase:

1. **Analyze styles** - Read the `<style>` blocks from both Vue files
2. **Create CSS file** - Create new CSS file with organized class structure
3. **Extract classes** - Copy all styles, organized by component/section
4. **Update HTML** - Replace `style="..."` attributes with `class="..."`
5. **Remove `<style>` block** - Delete the `<style scoped>` section from Vue
6. **Verify build** - Run `npm run build` to ensure no errors
7. **Test visually** - Check the app still looks correct (optional but recommended)

---

## Naming Convention for Classes

All extracted classes will follow this pattern:

```css
/* Container/Page level */
.admin-dashboard { }
.login-view { }

/* Sections within components */
.admin-dashboard__header { }
.admin-dashboard__content { }
.admin-dashboard__modal { }

/* Reusable components (shared across multiple files) */
.modal-overlay { }
.btn-primary { }
.form-group { }
.form-input { }

/* State variants */
.message.success { }
.message.error { }
.btn-action.disabled { }
```

---

## CSS File Organization After Phase 2

```
src/styles/
├── tokens/
│   ├── colors.css
│   ├── spacing.css
│   ├── typography.css
│   ├── shadows.css
│   └── borders.css
├── views/
│   ├── dashboards.css         (from subphases 2.1, 2.2)
│   ├── auth.css               (from subphases 2.3, 2.4)
│   ├── admin.css              (from subphase 2.6)
│   └── layout.css             (from subphase 2.8)
├── components/
│   ├── sections.css           (from subphase 2.5)
│   ├── navigation.css         (from subphase 2.7)
│   └── form-inputs.css        (from subphase 2.7)
├── base.css
└── index.css
```

---

## Recommended Order

**Option A: Start with Dashboards** (Most Complex)
1. Subphase 2.1: AdminDashboard + TeacherDashboard
2. Subphase 2.2: StudentDashboard + ParentDashboard
3. Continue with auth...

**Option B: Start with Auth** (Fewer Dependencies)
1. Subphase 2.3: LoginView + RegisterView
2. Subphase 2.4: RegisterTeacherView + RegistrationPendingView
3. Continue with sections...

**Option C: Balanced Difficulty** (Recommended)
1. Subphase 2.3: Auth (simpler, build confidence)
2. Subphase 2.5: Sections (medium complexity)
3. Subphase 2.1: Dashboards (most complex)
4. Continue...

---

## Next Steps

Which subphase would you like to start with?

- **2.1** (AdminDashboard + TeacherDashboard) - Most complex, creates dashboards.css
- **2.3** (LoginView + RegisterView) - Simpler, creates auth.css
- **2.5** (ProfileSection + ConnectionsSection) - Medium, creates sections.css

I recommend starting with **2.3 or 2.5** to build confidence, then tackling 2.1 (the most complex).
