# eStudiez — AI Agent Instructions

eStudiez is a **frontend-only** React SPA for tracking high-school (THPT) study progress: marks, attendance, timetables, resources, revision classes, news, chat, and AI-style learning paths. There is **no backend** — all data is mock JSON served from `public/data/` and persisted to `localStorage`. See [doc/REQUIREMENTS.md](doc/REQUIREMENTS.md) for the full feature spec.

## Stack & Commands

- React 19 · TypeScript 6 · React Router 7 · Vite 8 · Tailwind CSS v4 (via `@tailwindcss/vite`, no config file).
- `npm run dev` — start dev server · `npm run build` — `tsc -b && vite build` · `npm run lint` — ESLint · `npm run preview`.
- Always run `npm run lint` after changes. `tsconfig.app.json` enables `noUnusedLocals`/`noUnusedParameters`, so unused imports/vars fail the build.
- No path aliases — use relative imports (`../context/DataContext`, `../types`).

## Architecture

- **Provider order matters** ([src/main.tsx](src/main.tsx)): `BrowserRouter` → `ToastProvider` → `DataProvider` → `AuthProvider` → `App`. Auth depends on data, both depend on toast.
- **Routing** ([src/App.tsx](src/App.tsx)): all routes render inside `<Layout>`. Protect routes with [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) (`<ProtectedRoute allowedRoles={['admin']}>`); unauthenticated → `/login`, wrong role → `/dashboard`.
- **Role-based dashboards**: [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) switches on `currentUser.role` to render the matching file in [src/pages/dashboard/](src/pages/dashboard/) (`AdminDashboard`, `TeacherDashboard`, `StudentDashboard`, `ParentDashboard`).
- **Types are centralized** in [src/types.ts](src/types.ts). Roles: `'admin' | 'teacher' | 'student' | 'parent'`. Reuse these types — do not redefine entity shapes locally.

## Data Layer (the critical pattern)

All app data flows through [src/context/DataContext.tsx](src/context/DataContext.tsx):

- On mount, `bootstrap()` fetches every `public/data/*.json` in parallel. The `cached()` wrapper reads from `localStorage` first (keys like `estudiez.users`, `estudiez.scores`); `classes`, `subjects`, and `helplines` are read-only and not cached.
- `chat.json` is special — it has `{ groups, messages }` and is split into `chatGroups` / `chatMessages`.
- Each state array has a `useEffect` that **auto-persists to `localStorage`** after init. Do not write to `localStorage` manually for these — mutate via the provided functions.
- **Mutate only through DataContext functions** (`addUser`, `updateUser`, `addScore`, `addProgress`, `addAttendance`, `addResource`, `addRevisionClass`, `addEvaluation`, `addNews`, `addNotification`, `addChatMessage`, `addRegistrationRequest`, `approveRegistration`, `rejectRegistration`). Adders take `Omit<T, 'id'>` and assign auto-incrementing numeric `id`s.
- Access data via the `useData()` hook ([src/hooks/useData.ts](src/hooks/useData.ts)). Role visibility is enforced **client-side by filtering arrays** (e.g. a student sees only rows where `studentEmail === currentUser.email`), never server-side.

## Auth & Conventions

- Auth ([src/context/AuthContext.tsx](src/context/AuthContext.tsx)) is mock: plain-text passwords, case-insensitive email match, `currentUser` persisted under `estudiez.currentUser`. Use `useAuth()` — never read `localStorage` directly. Do not add real-auth/security hardening unless asked; this is intentional demo data.
- All three hooks (`useAuth`, `useData`, `useToast`) **throw if used outside their provider** — keep that pattern for any new context.
- **Styling is Tailwind utility classes in JSX only** — no CSS files/modules (`index.css` is just `@import "tailwindcss";`). Palette: indigo primary, slate neutrals, emerald/rose/amber for status. Use `Record<Status, string>` lookup maps for status styling (see existing dashboards).
- **Reuse shared components**: `Card` (title/description/actions/children), `FormField` (polymorphic via `as="input|select|textarea"`, supports `error`/`hint`), `Tabs`, `TimetableGrid`, `ChatPanel`, `NotificationBell`. Dashboards compose `Tabs` with file-scoped inner components per tab.
- **Naming**: components PascalCase, hooks `useX`, handlers `handleX`, constants UPPER_SNAKE_CASE. Form errors typed as `Partial<Record<keyof FormState, string>>`, validated before submit and shown inline via `FormField`.
- Use `useToast().push('success'|'error'|'info', msg)` for user feedback after mutations.

## Adding a Feature (typical flow)

1. Add/extend the entity type in [src/types.ts](src/types.ts).
2. If it needs persisted data, add state + a `cached()` load + a persist `useEffect` + mutator(s) in [src/context/DataContext.tsx](src/context/DataContext.tsx) and expose them on `DataContextValue`. Seed `public/data/<name>.json`.
3. Build UI in the relevant dashboard/page, reading via `useData()`, gating with role checks, styling with Tailwind, and reusing `Card`/`FormField`/`Tabs`.
4. Run `npm run lint`.
