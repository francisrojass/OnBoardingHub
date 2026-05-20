#!/bin/bash
# =============================================================================
# Crear labels y 50 issues en GitHub para OnBoardingHub
# =============================================================================

REPO="francisrojass/OnBoardingHub"

echo "============================================"
echo " Creando labels en $REPO"
echo "============================================"

# --- Labels de área ---
gh api "repos/$REPO/labels" -f name="client"          -f color="1D76DB" -f description="Frontend React/Vite" 2>/dev/null || echo "  (label 'client' ya existe)"
gh api "repos/$REPO/labels" -f name="server"          -f color="0E8A16" -f description="Backend Node/Express/Prisma" 2>/dev/null || echo "  (label 'server' ya existe)"
gh api "repos/$REPO/labels" -f name="database"        -f color="D93F0B" -f description="Prisma schema, migrations, seed" 2>/dev/null || echo "  (label 'database' ya existe)"
gh api "repos/$REPO/labels" -f name="docker"          -f color="5319E7" -f description="Docker, sandboxes, containers" 2>/dev/null || echo "  (label 'docker' ya existe)"
gh api "repos/$REPO/labels" -f name="shared"          -f color="FBCA04" -f description="Shared types package" 2>/dev/null || echo "  (label 'shared' ya existe)"
gh api "repos/$REPO/labels" -f name="devops"          -f color="B60205" -f description="CI/CD, scripts, infraestructura" 2>/dev/null || echo "  (label 'devops' ya existe)"
gh api "repos/$REPO/labels" -f name="docs"            -f color="0075CA" -f description="Documentación y README" 2>/dev/null || echo "  (label 'docs' ya existe)"
gh api "repos/$REPO/labels" -f name="testing"         -f color="D4C5F9" -f description="Tests unitarios/integración" 2>/dev/null || echo "  (label 'testing' ya existe)"
gh api "repos/$REPO/labels" -f name="feature"         -f color="A2EEEF" -f description="Nueva funcionalidad" 2>/dev/null || echo "  (label 'feature' ya existe)"
gh api "repos/$REPO/labels" -f name="setup"           -f color="C5DEF5" -f description="Configuración inicial" 2>/dev/null || echo "  (label 'setup' ya existe)"
gh api "repos/$REPO/labels" -f name="sandbox-content" -f color="F9D0C4" -f description="Contenido formativo (Boxes)" 2>/dev/null || echo "  (label 'sandbox-content' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-1" -f color="EDEDED" -f description="Sprint 1: Infraestructura base" 2>/dev/null || echo "  (label 'sprint-1' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-2" -f color="EDEDED" -f description="Sprint 2: Auth y modelo de datos" 2>/dev/null || echo "  (label 'sprint-2' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-3" -f color="EDEDED" -f description="Sprint 3: Dashboard y Boxes" 2>/dev/null || echo "  (label 'sprint-3' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-4" -f color="EDEDED" -f description="Sprint 4: Sandboxes Docker" 2>/dev/null || echo "  (label 'sprint-4' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-5" -f color="EDEDED" -f description="Sprint 5: Tareas y progreso" 2>/dev/null || echo "  (label 'sprint-5' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-6" -f color="EDEDED" -f description="Sprint 6: Admin y reportes" 2>/dev/null || echo "  (label 'sprint-6' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-7" -f color="EDEDED" -f description="Sprint 7: Contenido y RBAC" 2>/dev/null || echo "  (label 'sprint-7' ya existe)"
gh api "repos/$REPO/labels" -f name="sprint-8" -f color="EDEDED" -f description="Sprint 8: Testing y docs" 2>/dev/null || echo "  (label 'sprint-8' ya existe)"

echo ""
echo "============================================"
echo " Creando issues..."
echo "============================================"

# ============================================================
# SPRINT 1 — Infraestructura base
# ============================================================
echo "--- Sprint 1: Infraestructura ---"

gh issue create -R "$REPO" --title "Setup monorepo structure (client, server, shared)" \
  --body $'Create the monorepo with three npm packages:\n- `client/` — React + Vite + TypeScript\n- `server/` — Node.js + Express + TypeScript\n- `shared/` — Shared TypeScript types\n\n**Acceptance criteria:**\n- [ ] Three `package.json` files with workspace references\n- [ ] `tsconfig.json` configured for each package\n- [ ] Workspace-level scripts for dev/build' \
  --label "setup,devops,sprint-1"

gh issue create -R "$REPO" --title "Configure Docker Compose for PostgreSQL and pgAdmin" \
  --body $'Create `docker-compose.yml` with:\n- `postgres:15-alpine` on port 5432\n- `dpage/pgadmin4` on port 5050\n- Named volume `pg_data`\n\n**Acceptance criteria:**\n- [ ] `docker compose up -d` starts both containers\n- [ ] pgAdmin accessible at http://localhost:5050\n- [ ] Data persists across restarts' \
  --label "setup,docker,database,sprint-1"

gh issue create -R "$REPO" --title "Initialize Prisma ORM with PostgreSQL datasource" \
  --body $'Install Prisma in server/, configure schema.prisma.\n\n**Acceptance criteria:**\n- [ ] `prisma.config.ts` created\n- [ ] Connection to Docker PostgreSQL verified\n- [ ] `npx prisma migrate dev` runs successfully' \
  --label "setup,server,database,sprint-1"

gh issue create -R "$REPO" --title "Create start_env.sh automation script" \
  --body $'Shell script that opens three Windows Terminal tabs:\n1. Docker Compose up\n2. Server npm run dev\n3. Client npm run dev\n\n**Acceptance criteria:**\n- [ ] Single command starts entire dev environment\n- [ ] Each service gets its own terminal tab' \
  --label "setup,devops,sprint-1"

gh issue create -R "$REPO" --title "Configure Vite + React + TypeScript for client" \
  --body $'Initialize Vite project with React-TS template.\n\n**Acceptance criteria:**\n- [ ] `vite.config.ts` with API proxy\n- [ ] Base `styles.css` with CSS custom properties\n- [ ] Environment variables (`VITE_API_URL`) working\n- [ ] Dev server on port 5173' \
  --label "setup,client,sprint-1"

gh issue create -R "$REPO" --title "Configure Express + TypeScript for server" \
  --body $'Setup Express app with TypeScript.\n\n**Acceptance criteria:**\n- [ ] `app.ts` with CORS, JSON body parser\n- [ ] `/api/health` endpoint\n- [ ] Centralized error handler middleware\n- [ ] Environment config module\n- [ ] Logger utility' \
  --label "setup,server,sprint-1"

gh issue create -R "$REPO" --title "Define shared TypeScript types package" \
  --body $'Create shared types for client and server.\n\n**Acceptance criteria:**\n- [ ] `User`, `Box`, `Sandbox`, `SandboxStatus` interfaces\n- [ ] Importable from both packages\n- [ ] `package.json` with proper main/types fields' \
  --label "setup,shared,sprint-1"

# ============================================================
# SPRINT 2 — Autenticación y modelo de datos
# ============================================================
echo "--- Sprint 2: Auth y modelo de datos ---"

gh issue create -R "$REPO" --title "Design Prisma schema: User, Company, Box, Sandbox models" \
  --body $'Create initial data model with all core entities.\n\n**Models:** User, Company, Box, Sandbox, CompanyBox\n**Enums:** Role (EMPLOYEE, ADMIN, SUPER_ADMIN), Difficulty, SandboxStatus\n\n**Acceptance criteria:**\n- [ ] Schema compiles without errors\n- [ ] Migration `init` creates all tables\n- [ ] Relations verified in pgAdmin' \
  --label "feature,server,database,sprint-2"

gh issue create -R "$REPO" --title "Implement auth module: register and login with JWT" \
  --body $'Create `modules/auth/` with authentication.\n\n**Acceptance criteria:**\n- [ ] POST /register — creates user with bcrypt hash\n- [ ] POST /login — returns JWT\n- [ ] First user of company gets ADMIN role\n- [ ] JWT contains userId, role, companyId\n- [ ] 409 on duplicate email, 401 on bad credentials' \
  --label "feature,server,sprint-2"

gh issue create -R "$REPO" --title "Create verifyToken middleware for JWT authentication" \
  --body $'Protect API routes with JWT verification.\n\n**Acceptance criteria:**\n- [ ] Extracts Bearer token from header\n- [ ] Verifies with JWT_SECRET\n- [ ] Attaches decoded user to `req.user`\n- [ ] Returns 401 on invalid/missing token' \
  --label "feature,server,sprint-2"

gh issue create -R "$REPO" --title "Implement user module: CRUD and profile endpoints" \
  --body $'Create `modules/users/` for user management.\n\n**Acceptance criteria:**\n- [ ] GET /users/me — current user with company\n- [ ] PUT /users/me — update name, avatar\n- [ ] GET /users — list (ADMIN: own company only)\n- [ ] All routes protected with verifyToken' \
  --label "feature,server,sprint-2"

gh issue create -R "$REPO" --title "Implement company module: company data management" \
  --body $'Create `modules/companies/` with multitenant isolation.\n\n**Acceptance criteria:**\n- [ ] GET /companies/mine — current company\n- [ ] PUT /companies/mine — update (ADMIN only)\n- [ ] Users only access own company' \
  --label "feature,server,sprint-2"

gh issue create -R "$REPO" --title "Create AuthContext with JWT management in React" \
  --body $'Auth state management for frontend.\n\n**Acceptance criteria:**\n- [ ] `AuthContext.tsx` with token, user, login, register, logout\n- [ ] Axios interceptor for Bearer token\n- [ ] `AuthLayout` redirects unauthenticated users\n- [ ] Token persisted in localStorage' \
  --label "feature,client,sprint-2"

gh issue create -R "$REPO" --title "Create Welcome page (landing)" \
  --body $'Public landing page.\n\n**Acceptance criteria:**\n- [ ] Hero with OnBoardingHub branding\n- [ ] Login / Register CTA buttons\n- [ ] Responsive layout\n- [ ] No auth required' \
  --label "feature,client,sprint-2"

gh issue create -R "$REPO" --title "Create Login page with JWT authentication" \
  --body $'Login form connected to auth API.\n\n**Acceptance criteria:**\n- [ ] Email + password form\n- [ ] Calls POST /auth/login\n- [ ] Stores JWT, redirects to Dashboard\n- [ ] Error handling for invalid credentials' \
  --label "feature,client,sprint-2"

gh issue create -R "$REPO" --title "Create Register page with company auto-creation" \
  --body $'Registration form for new users.\n\n**Acceptance criteria:**\n- [ ] Fields: name, email, password, company\n- [ ] Calls POST /auth/register\n- [ ] Auto-login after registration\n- [ ] ADMIN role feedback if first user' \
  --label "feature,client,sprint-2"

# ============================================================
# SPRINT 3 — Dashboard, Boxes y navegación
# ============================================================
echo "--- Sprint 3: Dashboard y Boxes ---"

gh issue create -R "$REPO" --title "Create Sidebar component with role-based navigation" \
  --body $'Collapsible sidebar filtered by role.\n\n**Acceptance criteria:**\n- [ ] Avatar, name, role badge\n- [ ] Common links: Dashboard, Learning Hub, Tasks, Notifications, Profile\n- [ ] ADMIN-only: Task Management, Reports, Company Settings\n- [ ] SUPER_ADMIN-only: IT Panel\n- [ ] Active route highlighting\n- [ ] Logout button' \
  --label "feature,client,sprint-3"

gh issue create -R "$REPO" --title "Create reusable UI components: Button, Card, ConfirmModal" \
  --body $'Shared presentational components.\n\n**Acceptance criteria:**\n- [ ] `Button.tsx`: primary/secondary/danger, loading state\n- [ ] `Card.tsx`: title, badge, children\n- [ ] `ConfirmModal.tsx`: confirm/cancel actions\n- [ ] TypeScript props' \
  --label "feature,client,sprint-3"

gh issue create -R "$REPO" --title "Implement box module: CRUD and catalog API" \
  --body $'Create `modules/boxes/` for Box management.\n\n**Acceptance criteria:**\n- [ ] GET /boxes — list (company filtered)\n- [ ] GET /boxes/:id — detail\n- [ ] POST /boxes — create (SUPER_ADMIN)\n- [ ] PUT /boxes/:id — update\n- [ ] DELETE /boxes/:id — delete' \
  --label "feature,server,sprint-3"

gh issue create -R "$REPO" --title "Create Dashboard page with Box inventory and XP stats" \
  --body $'Main employee view after login.\n\n**Acceptance criteria:**\n- [ ] Box card grid with difficulty/XP badges\n- [ ] User stats: total XP, level, completed count\n- [ ] Progress per box\n- [ ] Click navigates to BoxDetail\n- [ ] Responsive grid' \
  --label "feature,client,sprint-3"

gh issue create -R "$REPO" --title "Create BoxDetail page with metadata display" \
  --body $'Single Box detail view.\n\n**Acceptance criteria:**\n- [ ] Title, description, objectives\n- [ ] Difficulty and XP badges\n- [ ] Launch Sandbox button\n- [ ] Guide content (Markdown)\n- [ ] Progress status' \
  --label "feature,client,sprint-3"

gh issue create -R "$REPO" --title "Create Profile page with user data editing" \
  --body $'User profile view and edit.\n\n**Acceptance criteria:**\n- [ ] Display: name, email, role, company, XP, level\n- [ ] Edit name and avatar\n- [ ] Role badge (non-editable)\n- [ ] Save feedback' \
  --label "feature,client,sprint-3"

# ============================================================
# SPRINT 4 — Sandboxes Docker
# ============================================================
echo "--- Sprint 4: Sandboxes Docker ---"

gh issue create -R "$REPO" --title "Implement sandbox service: Docker container lifecycle" \
  --body $'Core service for Docker container management.\n\n**Acceptance criteria:**\n- [ ] `launchSandbox()`: create container, map port\n- [ ] `stopSandbox()`: stop and remove\n- [ ] `getSandboxStatus()`: check via Docker API\n- [ ] Dockerode library integration\n- [ ] Dynamic port allocation\n- [ ] Error handling' \
  --label "feature,server,docker,sprint-4"

gh issue create -R "$REPO" --title "Implement sandbox controller and routes" \
  --body $'REST API for sandbox operations.\n\n**Acceptance criteria:**\n- [ ] POST /sandboxes/launch\n- [ ] POST /sandboxes/:id/stop\n- [ ] GET /sandboxes/active\n- [ ] GET /sandboxes/:id\n- [ ] Protected with verifyToken' \
  --label "feature,server,sprint-4"

gh issue create -R "$REPO" --title "Create ubuntu-basic sandbox Docker template" \
  --body $'Base sandbox with Ubuntu terminal via ttyd.\n\n**Acceptance criteria:**\n- [ ] Dockerfile: Ubuntu 22.04 + ttyd\n- [ ] ENTRYPOINT: bash via ttyd on port 7681\n- [ ] metadata.json with difficulty=BEGINNER\n- [ ] Image builds as `onboardinghub/ubuntu-basic`' \
  --label "feature,docker,sandbox-content,sprint-4"

gh issue create -R "$REPO" --title "Create fullstack-node-python sandbox Docker template" \
  --body $'Full-stack development sandbox.\n\n**Acceptance criteria:**\n- [ ] Dockerfile: Node.js 20 + Python 3 + ttyd\n- [ ] Terminal on port 7681\n- [ ] metadata.json: category=FullStack\n- [ ] Image builds successfully' \
  --label "feature,docker,sandbox-content,sprint-4"

gh issue create -R "$REPO" --title "Implement Guide-Beside-Sandbox pattern in BoxDetail" \
  --body $'Split-panel: guide + sandbox terminal.\n\n**Acceptance criteria:**\n- [ ] Left: Markdown guide\n- [ ] Right: sandbox iframe (ttyd)\n- [ ] Responsive stacking on mobile\n- [ ] Collapsible guide panel\n- [ ] Connection status indicator' \
  --label "feature,client,sprint-4"

gh issue create -R "$REPO" --title "Add innerPort field to Box model" \
  --body $'Support different ports per sandbox type.\n\n**Acceptance criteria:**\n- [ ] Migration: `innerPort Int @default(7681)`\n- [ ] Sandbox service reads innerPort\n- [ ] Existing boxes default to 7681' \
  --label "feature,server,database,sprint-4"

gh issue create -R "$REPO" --title "Implement sandbox-templates module: filesystem sync" \
  --body $'Sync templates from filesystem to DB.\n\n**Acceptance criteria:**\n- [ ] GET /templates — list from docker/sandboxes/\n- [ ] POST /templates/sync — scan, parse metadata, upsert Box\n- [ ] Reads Dockerfile, metadata.json, guide/\n- [ ] SUPER_ADMIN only' \
  --label "feature,server,docker,sprint-4"

# ============================================================
# SPRINT 5 — Tareas y progreso
# ============================================================
echo "--- Sprint 5: Tareas y progreso ---"

gh issue create -R "$REPO" --title "Design Task and BoxProgress models in Prisma" \
  --body $'Add task and progress tracking.\n\n**Acceptance criteria:**\n- [ ] `Task` model with status, priority, category, boxId\n- [ ] `BoxProgress` model with xpEarned, completedAt\n- [ ] Enums: TaskStatus, Priority\n- [ ] Migrations applied' \
  --label "feature,server,database,sprint-5"

gh issue create -R "$REPO" --title "Implement task module: CRUD with Box linking" \
  --body $'Task management API.\n\n**Acceptance criteria:**\n- [ ] GET /tasks — list for current user\n- [ ] POST /tasks — create (ADMIN assigns)\n- [ ] PUT /tasks/:id — update status\n- [ ] DELETE /tasks/:id — ADMIN only\n- [ ] Optional boxId linking' \
  --label "feature,server,sprint-5"

gh issue create -R "$REPO" --title "Implement progress module: XP and leveling" \
  --body $'Gamification tracking.\n\n**Acceptance criteria:**\n- [ ] POST /progress/complete — award XP\n- [ ] GET /progress — user progress\n- [ ] GET /progress/stats — aggregated\n- [ ] Level calculation from XP\n- [ ] Notification on XP gain' \
  --label "feature,server,sprint-5"

gh issue create -R "$REPO" --title "Create Tasks page for employee view" \
  --body $'Employee task list.\n\n**Acceptance criteria:**\n- [ ] Task list with status badges\n- [ ] Filter by status and priority\n- [ ] Task detail with linked Box\n- [ ] Mark as in-progress/completed' \
  --label "feature,client,sprint-5"

gh issue create -R "$REPO" --title "Create LearningHub page with progress tracking" \
  --body $'Central learning view for employees.\n\n**Acceptance criteria:**\n- [ ] Box catalog with progress bars\n- [ ] XP summary and level\n- [ ] Category grouping\n- [ ] Gamification visuals' \
  --label "feature,client,sprint-5"

gh issue create -R "$REPO" --title "Create AdminTasks page for task management (ADMIN)" \
  --body $'Admin task creation and management.\n\n**Acceptance criteria:**\n- [ ] Create form: title, description, priority, employee, Box\n- [ ] Table view with filters\n- [ ] Edit and delete actions\n- [ ] ADMIN role required' \
  --label "feature,client,sprint-5"

# ============================================================
# SPRINT 6 — Admin y reportes
# ============================================================
echo "--- Sprint 6: Admin y reportes ---"

gh issue create -R "$REPO" --title "Design Notification model in Prisma" \
  --body $'Add notification support.\n\n**Acceptance criteria:**\n- [ ] `Notification` model: id, userId, title, message, read, type, createdAt\n- [ ] NotificationType enum\n- [ ] Migration applied' \
  --label "feature,server,database,sprint-6"

gh issue create -R "$REPO" --title "Implement notification module: CRUD and triggers" \
  --body $'Notification API.\n\n**Acceptance criteria:**\n- [ ] GET /notifications — list with unread count\n- [ ] PUT /notifications/:id/read\n- [ ] PUT /notifications/read-all\n- [ ] Internal triggers on task/XP/box events' \
  --label "feature,server,sprint-6"

gh issue create -R "$REPO" --title "Create Notifications page" \
  --body $'Notification center.\n\n**Acceptance criteria:**\n- [ ] Chronological list\n- [ ] Read vs unread visual distinction\n- [ ] Type icons\n- [ ] Mark all as read\n- [ ] Badge count in Sidebar' \
  --label "feature,client,sprint-6"

gh issue create -R "$REPO" --title "Implement admin module: SUPER_ADMIN operations" \
  --body $'Cross-tenant admin API.\n\n**Acceptance criteria:**\n- [ ] GET /admin/companies — all companies\n- [ ] GET /admin/sandboxes/active — all sandboxes\n- [ ] DELETE /admin/sandboxes/:id — force stop\n- [ ] GET /admin/users — all users\n- [ ] SUPER_ADMIN check' \
  --label "feature,server,sprint-6"

gh issue create -R "$REPO" --title "Create Admin (IT Panel) page for SUPER_ADMIN" \
  --body $'Global monitoring panel.\n\n**Acceptance criteria:**\n- [ ] Active sandboxes monitoring\n- [ ] Global Box catalog + sync\n- [ ] New Box from template\n- [ ] Force-stop with confirmation\n- [ ] Company overview' \
  --label "feature,client,sprint-6"

gh issue create -R "$REPO" --title "Implement reports module: aggregated analytics" \
  --body $'Analytics API for ADMIN.\n\n**Acceptance criteria:**\n- [ ] GET /reports/company — by employee\n- [ ] GET /reports/categories — by category\n- [ ] GET /reports/timeline — XP per week\n- [ ] ADMIN only, own company\n- [ ] Export-friendly JSON' \
  --label "feature,server,sprint-6"

gh issue create -R "$REPO" --title "Create AdminReports page with analytics" \
  --body $'Reports view for ADMIN.\n\n**Acceptance criteria:**\n- [ ] Per-employee progress table\n- [ ] Category breakdown\n- [ ] Weekly XP trend\n- [ ] Date/employee/category filters\n- [ ] CSV export' \
  --label "feature,client,sprint-6"

gh issue create -R "$REPO" --title "Create CompanySettings page" \
  --body $'Company configuration.\n\n**Acceptance criteria:**\n- [ ] Edit: name, sector, size\n- [ ] Branding: logo, color\n- [ ] Users roster\n- [ ] ADMIN required' \
  --label "feature,client,sprint-6"

# ============================================================
# SPRINT 7 — Contenido y RBAC
# ============================================================
echo "--- Sprint 7: Contenido y RBAC ---"

gh issue create -R "$REPO" --title "Create git-workflow sandbox with guide and verification" \
  --body $'Interactive Git learning sandbox.\n\n**Contents:** Dockerfile (Ubuntu+Git+ttyd), guide/ (Markdown), verify-tasks.sh, metadata.json (DevOps, BEGINNER, 150 XP)\n\n**Acceptance criteria:**\n- [ ] Image builds and launches\n- [ ] Guide renders in Guide-Beside-Sandbox\n- [ ] verify-tasks.sh validates exercises\n- [ ] XP awarded on completion' \
  --label "feature,docker,sandbox-content,sprint-7"

gh issue create -R "$REPO" --title "Create timesheet-tracker sandbox with Node.js exercise" \
  --body $'Build a timesheet CLI sandbox.\n\n**Contents:** Dockerfile (Node.js+SQLite+ttyd), guide/, verify-tasks.sh, metadata.json (Backend, INTERMEDIATE, 250 XP)\n\n**Acceptance criteria:**\n- [ ] Image builds and launches\n- [ ] Full project lifecycle guide\n- [ ] Verification checks milestones\n- [ ] XP awarded' \
  --label "feature,docker,sandbox-content,sprint-7"

gh issue create -R "$REPO" --title "Implement verify-tasks.sh execution endpoint" \
  --body $'Run verification inside sandbox containers.\n\n**Acceptance criteria:**\n- [ ] POST /sandboxes/:id/verify\n- [ ] Returns { passed, checks[] }\n- [ ] On pass: box completion + XP + notification\n- [ ] 30s timeout protection\n- [ ] Error if container not running' \
  --label "feature,server,docker,sprint-7"

gh issue create -R "$REPO" --title "Add SUPER_ADMIN role and migration" \
  --body $'Three-tier role system.\n\n**Acceptance criteria:**\n- [ ] SUPER_ADMIN in Role enum\n- [ ] Migration applied\n- [ ] verifyToken handles new role\n- [ ] Existing users unaffected' \
  --label "feature,server,database,sprint-7"

gh issue create -R "$REPO" --title "Implement RBAC middleware for role-based protection" \
  --body $'Fine-grained access control.\n\n**Acceptance criteria:**\n- [ ] `requireRole()` middleware, 403 if unauthorized\n- [ ] SUPER_ADMIN: /admin/*, /templates/sync\n- [ ] ADMIN: tasks CRUD, reports, company\n- [ ] EMPLOYEE: own data only\n- [ ] Multitenant isolation' \
  --label "feature,server,sprint-7"

gh issue create -R "$REPO" --title "Add guide field to Box model for Markdown content" \
  --body $'Store guide in Box records.\n\n**Acceptance criteria:**\n- [ ] Migration: `guide String?`\n- [ ] Template sync stores Markdown\n- [ ] BoxDetail renders guide' \
  --label "feature,server,database,sprint-7"

gh issue create -R "$REPO" --title "Create build-all.sh script for sandbox images" \
  --body $'Bulk build all sandbox Docker images.\n\n**Acceptance criteria:**\n- [ ] Iterates docker/sandboxes/*/\n- [ ] Tags as onboardinghub/<name>\n- [ ] Skips dirs without Dockerfile\n- [ ] Reports per-image result' \
  --label "feature,docker,devops,sprint-7"

# ============================================================
# SPRINT 8 — Testing y docs
# ============================================================
echo "--- Sprint 8: Testing y docs ---"

gh issue create -R "$REPO" --title "Write unit tests for Welcome and Login pages" \
  --body $'React Testing Library + Vitest.\n\n**Acceptance criteria:**\n- [ ] Welcome: renders hero, has links\n- [ ] Login: form renders, submits, handles errors\n- [ ] Tests pass' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Write unit tests for Register page" \
  --body $'**Acceptance criteria:**\n- [ ] Renders all fields\n- [ ] Validates required\n- [ ] Handles success/error' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Write unit tests for Dashboard and BoxDetail" \
  --body $'**Acceptance criteria:**\n- [ ] Dashboard: box cards, XP stats\n- [ ] BoxDetail: metadata, launch button, guide' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Write unit tests for Sidebar component" \
  --body $'**Acceptance criteria:**\n- [ ] Correct links per role\n- [ ] EMPLOYEE: no admin links\n- [ ] Active route highlighted\n- [ ] Logout works' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Write unit tests for AdminTasks and AdminReports" \
  --body $'**Acceptance criteria:**\n- [ ] AdminTasks: list, form, filters\n- [ ] AdminReports: tables, export button' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Write unit tests for Profile, Notifications, CompanySettings" \
  --body $'**Acceptance criteria:**\n- [ ] Profile: data, edit form\n- [ ] Notifications: list, read/unread\n- [ ] CompanySettings: form, ADMIN check' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Write unit tests for LearningHub and Tasks" \
  --body $'**Acceptance criteria:**\n- [ ] LearningHub: catalog, progress, XP\n- [ ] Tasks: list, filters' \
  --label "testing,client,sprint-8"

gh issue create -R "$REPO" --title "Create Prisma seed script with demo data" \
  --body $'Realistic test data.\n\n**Acceptance criteria:**\n- [ ] Demo company\n- [ ] 1 SUPER_ADMIN, 1 ADMIN, 2 EMPLOYEES\n- [ ] Sample Boxes, tasks, notifications, progress\n- [ ] Runs via `npx prisma db seed`' \
  --label "feature,server,database,sprint-8"

gh issue create -R "$REPO" --title "Write project README.md with setup instructions" \
  --body $'Comprehensive documentation.\n\n**Acceptance criteria:**\n- [ ] Project description + architecture\n- [ ] Quick start (Docker + npm)\n- [ ] Environment variables\n- [ ] API summary\n- [ ] Copyright (Universidad de Sevilla)' \
  --label "docs,sprint-8"

gh issue create -R "$REPO" --title "Configure global CSS design system" \
  --body $'Base styling for the application.\n\n**Acceptance criteria:**\n- [ ] CSS custom properties\n- [ ] Professional light theme\n- [ ] Responsive breakpoints\n- [ ] Component styles\n- [ ] Layout: sidebar + topbar + content' \
  --label "feature,client,sprint-8"

gh issue create -R "$REPO" --title "Add comprehensive onboarding migration" \
  --body $'Final migration consolidating all models.\n\n**Acceptance criteria:**\n- [ ] BoxProgress unique [userId, boxId]\n- [ ] Notification + NotificationType enum\n- [ ] CompanyBox junction\n- [ ] All indexes verified\n- [ ] Clean history' \
  --label "feature,server,database,sprint-8"

echo ""
echo "============================================"
echo " Listo! Todas las issues creadas."
echo "============================================"
