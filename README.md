# 🚀 OnBoardingHub

> **Transformando el proceso de integración en el sector tecnológico: del "leer manuales" al "aprender haciendo".**

Bienvenido al repositorio oficial de **OnBoardingHub**. Este espacio aloja el desarrollo de mi Trabajo de Fin de Grado (TFG), enfocado desde la perspectiva de la **Arquitectura de Software**.

---

## 🎯 El problema que queremos resolver
En el sector de la consultoría tecnológica, los procesos de incorporación (*onboarding*) de nuevos empleados suelen ser lentos, repetitivos y poco eficientes. Tradicionalmente, dependen en gran medida de leer documentación estática interminable o de consumir el valioso tiempo de otros compañeros asignados como mentores.

## 💡 Nuestra Propuesta: La idea detrás de OnBoardingHub
Nuestra visión es construir una plataforma modular y escalable que actúe como un **centro de mando (Hub)** para orquestar toda la entrada de un nuevo trabajador. 

No se trata de un simple portal para subir documentos burocráticos. Es una herramienta técnica que propone un cambio de paradigma real:

* 🛠️ **Entornos Sandbox:** Espacios seguros y simulados donde el nuevo empleado se enfrenta a tareas reales desde el primer día (ej. hacer *Pull Requests* o simulaciones de despliegues).
* 🛡️ **Riesgo Cero:** Todo ocurre en un entorno controlado que no afecta a los sistemas reales de la empresa.
* 🚀 **Aprendizaje Activo:** Fomentamos el *Learning by Doing*, acelerando la curva de aprendizaje y la autonomía del desarrollador.

---

## 🏗️ Visión de Arquitectura
Actualmente, el proyecto se encuentra en su fase de diseño. La aplicación que se construirá aquí seguirá un modelo de **Microservicios** aplicando los principios de **Domain-Driven Design (DDD)**. 

Esto garantizará:
- **Alta escalabilidad** del sistema.
- **Independencia** entre dominios (gestión de usuarios, simulador sandbox, orquestador de tareas, etc.).
- Uso de tecnologías modernas como **Docker** para la contenedorización y levantamiento de entornos.
- Metodologías estructuradas como **Gitflow** para una gestión profesional de las ramas de código.

---

## ⏳ Estado del Proyecto
🚧 **Fase actual:** Diseño, bases arquitectónicas y definición de infraestructura.
🔜 **Próximos pasos:** Inicio del desarrollo de los microservicios principales para construir el Producto Mínimo Viable (MVP).

---

## 👨‍🎓 Sobre este TFG

* 👤 **Autores:** Francisco José Rojas Ramírez & Francisco Redondo Barrera
* 👨‍🏫 **Tutor:** Juan Antonio Ortega Ramírez
* 🎓 **Titulación:** Grado en Ingeniería Informática (Tecnologías Informáticas)
* 🏛️ **Universidad:** Universidad de Sevilla (Escuela Técnica Superior de Ingeniería Informática)
* 📅 **Curso:** 2025/2026

---
*Desarrollado con pasión para mejorar la cultura de ingeniería.* 💻✨

Tienes razón, me lié. Aquí va el contenido limpio para que lo copies:

---

## 🛠️ Guía de Instalación y Puesta en Marcha

### Prerrequisitos

Antes de clonar el proyecto necesitas tener instalado:

- **Node.js v20+** — instálalo con nvm (recomendado)
- **npm v9+** — viene incluido con Node.js
- **Docker v24+** — https://docs.docker.com/engine/install/ubuntu/
- **Git** — `sudo apt install git`

**Instalar Node.js 20 con nvm en Ubuntu:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Reinicia la terminal y ejecuta:
nvm install 20 && nvm use 20 && nvm alias default 20
```

**Usar Docker sin sudo en Ubuntu:**
```bash
sudo usermod -aG docker $USER && newgrp docker
```

---

### 1. Clonar el repositorio
```bash
git clone https://github.com/francisrojass/OnBoardingHub.git
cd OnBoardingHub
```

### 2. Configurar variables de entorno
```bash
cd server
cp .env.example .env
```
Para desarrollo local los valores por defecto del `.env.example` funcionan sin cambios.

### 3. Instalar dependencias
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Levantar la base de datos
Desde la raíz del proyecto:
```bash
docker compose up -d
docker compose ps
```
Deberías ver dos containers activos: `onboarding_db` y `onboarding_pgadmin`.

### 5. Ejecutar las migraciones
```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### 6. Arrancar el proyecto

Necesitas tres terminales:

**Terminal 1 — Base de datos** (si no la levantaste ya):
```bash
docker compose up -d
```

**Terminal 2 — Backend** (puerto 3001):
```bash
cd server && npm run dev
```

**Terminal 3 — Frontend** (puerto 5173):
```bash
cd client && npm run dev
```

Abre el navegador en **http://localhost:5173**

### 7. Verificar que todo funciona
```bash
curl http://localhost:3001/api/health
```
Respuesta esperada: `{"status":"ok","timestamp":"..."}`

---

### URLs del proyecto

- Frontend → http://localhost:5173
- Backend API → http://localhost:3001/api/v1
- Health check → http://localhost:3001/api/health
- pgAdmin → http://localhost:5050 (email: `admin@onboarding.dev` / pass: `admin`)

---

### Problemas frecuentes

**`permission denied` con Docker:**
```bash
sudo usermod -aG docker $USER && newgrp docker
```

**`Can't reach database server` al arrancar el backend:**
```bash
docker compose up -d
```

**Errores de migración tras cambiar el schema:**
```bash
cd server
npx prisma migrate dev --name descripcion_del_cambio
npx prisma generate
```