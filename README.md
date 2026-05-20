# OnBoardingHub

Plataforma gamificada de onboarding para empresas tecnológicas. Los nuevos empleados aprenden mediante **sandboxes interactivas** (contenedores Docker efímeros) que simulan tareas reales del puesto, reemplazando la documentación estática por aprendizaje práctico guiado.

## Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  React SPA  │◄──HTTP──►│  Express API │◄──SQL───►│ PostgreSQL  │
│  (Vite)     │         │ (Prisma ORM) │         │  (Docker)   │
└─────────────┘         └──────┬───────┘         └─────────────┘
                               │ Dockerode
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Git Workflow   UML Designer   Code Review ...
          (containers)   (containers)   (containers)
```

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | React 18, Vite 5, TanStack Query, React Router 6 | SPA con sistema de rutas protegidas y estado asíncrono |
| Backend | Express 5, TypeScript, Prisma ORM | API REST modular con JWT y gestión del ciclo de vida de contenedores |
| Base de datos | PostgreSQL 15 | Persistencia relacional (usuarios, tareas, progreso, sandboxes) |
| Sandboxes | Docker (Dockerode), ttyd | Contenedores efímeros con terminal web o UI embebida en iframe |
| Testing | Vitest, Testing Library | Tests unitarios y de componentes |

### Módulos del Backend

La API se organiza en módulos independientes bajo `server/src/modules/`:

`auth` · `users` · `companies` · `boxes` · `sandboxes` · `tasks` · `progress` · `notifications` · `reports` · `admin` · `sandbox-templates`

### Sandboxes Disponibles

| Sandbox | Dificultad | Tipo | Descripción |
|---------|-----------|------|-------------|
| Git Workflow | Principiante | Terminal (ttyd) | Práctica de flujo Git: feature branches, commits, push y merge |
| Timesheet Tracker | Principiante | Web UI | Imputación semanal de horas con envío al responsable |
| Code Review | Intermedio | Terminal (ttyd) | Revisión de Pull Request: detectar vulnerabilidades de seguridad |
| UML Designer | Intermedio | Web UI | Editor visual de diagramas de clases con generación de código C# |

---

## Requisitos Previos

- **Node.js 20+** (recomendado instalar con [nvm](https://github.com/nvm-sh/nvm))
- **Docker 24+** con permisos de usuario (`sudo usermod -aG docker $USER`)
- **Git**

## Instalación

```bash
# 1. Clonar
git clone https://github.com/francisrojass/OnBoardingHub.git
cd OnBoardingHub

# 2. Variables de entorno
cp server/.env.example server/.env

# 3. Dependencias
cd server && npm install && cd ../client && npm install && cd ..

# 4. Base de datos
docker compose up -d

# 5. Migraciones y generación del cliente Prisma
cd server
npx prisma migrate dev
npx prisma generate
```

## Ejecución

### Inicio rápido (script)

```bash
./start_env.sh
```

Abre tres pestañas de terminal con Docker, backend y frontend automáticamente.

### Inicio manual

```bash
# Terminal 1 – Base de datos
docker compose up -d

# Terminal 2 – Backend (puerto 3001)
cd server && npm run dev

# Terminal 3 – Frontend (puerto 5173)
cd client && npm run dev
```

Accede a la aplicación en **http://localhost:5173**

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://onboarding:onboarding_pass@localhost:5432/onboarding_hub` |
| `JWT_SECRET` | Clave de firma para tokens JWT | — (obligatorio) |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `7d` |
| `PORT` | Puerto del servidor Express | `3001` |
| `CLIENT_URL` | URL del frontend (CORS) | `http://localhost:5173` |
| `SANDBOX_PORT_RANGE_START` | Inicio del rango de puertos para sandboxes | `8100` |
| `SANDBOX_PORT_RANGE_END` | Fin del rango de puertos para sandboxes | `8999` |

## Scripts Disponibles

### Backend (`server/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Ejecuta la build de producción |
| `npm run prisma:migrate` | Ejecuta migraciones pendientes |
| `npm run prisma:studio` | Abre Prisma Studio (UI de base de datos) |
| `npm run prisma:seed` | Carga datos iniciales de ejemplo |

### Frontend (`client/`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run build` | Genera la build de producción |
| `npm test` | Ejecuta los tests con Vitest |
| `npm run test:watch` | Tests en modo watch |
| `npm run typecheck` | Comprobación de tipos sin emitir |

## URLs en Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001/api/v1 |
| Health check | http://localhost:3001/api/health |
| pgAdmin | http://localhost:5050 |

## Estructura del Proyecto

```
OnBoardingHub/
├── client/                 # SPA React (Vite)
│   └── src/
│       ├── components/     # Componentes reutilizables
│       ├── pages/          # Vistas principales
│       ├── context/        # Contexto de autenticación
│       ├── services/       # Cliente HTTP (Axios)
│       └── __tests__/      # Tests de componentes
├── server/                 # API Express
│   ├── src/
│   │   ├── modules/        # Módulos de dominio
│   │   ├── middlewares/    # Auth JWT, error handler
│   │   ├── config/         # Env y conexión DB
│   │   └── utils/          # Logger (Winston)
│   └── prisma/             # Schema, migraciones y seed
├── shared/                 # Tipos TypeScript compartidos
├── docker/
│   └── sandboxes/          # Dockerfiles de cada sandbox
└── docker-compose.yml      # PostgreSQL + pgAdmin
```

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| `permission denied` con Docker | `sudo usermod -aG docker $USER && newgrp docker` |
| `Can't reach database server` | Verificar que Postgres está corriendo: `docker compose up -d` |
| Puerto de sandbox ocupado | La plataforma reconcilia automáticamente contenedores huérfanos al lanzar |
| Error de migración | `cd server && npx prisma migrate dev --name fix && npx prisma generate` |

## Autores

- **Francisco José Rojas Ramírez** — desarrollo e implementación
- **Francisco Redondo Barrera** — desarrollo e implementación
- **Juan Antonio Ortega Ramírez** — tutor del proyecto

Trabajo de Fin de Grado · Grado en Ingeniería Informática (Tecnologías Informáticas)  
Universidad de Sevilla — ETSII · Curso 2025/2026