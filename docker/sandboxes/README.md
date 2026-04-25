# Sandboxes — OnBoardingHub

Cada carpeta dentro de este directorio define una sandbox interactiva completa.  
El sistema las detecta **automáticamente** al arrancar el servidor, crea (o actualiza) los registros en la base de datos y las muestra en la plataforma — sin tocar código.

---

## Cómo añadir una nueva sandbox

### 1. Crea la carpeta

```
docker/sandboxes/<nombre-kebab-case>/
├── Dockerfile
├── metadata.json
└── (otros archivos que necesite el build, ej. scripts)
```

El nombre de la carpeta se convierte en el nombre de la imagen Docker: `onboardinghub/<nombre>`.

---

### 2. Escribe el `Dockerfile`

El único requisito es que el contenedor arranque **`ttyd`** en el puerto interno y lo exponga:

```dockerfile
FROM onboardinghub/ubuntu-basic    # reutiliza la base local (git, ttyd, vim, nano, curl, tree)

# Instala herramientas adicionales
RUN apt-get update && apt-get install -y <paquete> && rm -rf /var/lib/apt/lists/*

# (opcional) scripts, repos, configuración
COPY mi-script.sh /opt/scripts/mi-script.sh
RUN chmod +x /opt/scripts/mi-script.sh

WORKDIR /root/workspace
EXPOSE 7681
ENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]
```

> **Tip:** Usa `FROM onboardinghub/ubuntu-basic` como base siempre que puedas.  
> Incluye `git`, `curl`, `vim`, `nano`, `ttyd` y `tree` sin necesitar descargar nada de internet.  
> Si necesitas una base diferente (Node, Python, Alpine…) usa `FROM` directamente, pero necesitarás conexión a Docker Hub la primera vez.

---

### 3. Crea el `metadata.json`

Este archivo define todo lo que se muestra en la plataforma. Es la única fuente de verdad:

```json
{
  "title": "Nombre que verán los usuarios",
  "description": "Descripción corta del entorno y para qué sirve.",
  "objectives": "1. Primer objetivo.\n2. Segundo objetivo.\n3. Tercer objetivo.",
  "guide": "# Guía en Markdown\n\nEscribe aquí la guía completa...\n\n## Tarea 1\n\n```bash\ncomando-de-ejemplo\n```",
  "difficulty": "BEGINNER",
  "innerPort": 7681,
  "xpReward": 100
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `title` | string | ✅ | Nombre visible en la plataforma |
| `description` | string | ✅ | Descripción corta del entorno |
| `objectives` | string | ✅ | Lista de objetivos (texto plano con saltos de línea `\n`) |
| `guide` | string | — | Guía completa en **Markdown**. Se muestra como panel lateral junto a la terminal |
| `difficulty` | string | ✅ | `BEGINNER` / `INTERMEDIATE` / `ADVANCED` |
| `innerPort` | number | ✅ | Puerto interno que expone `ttyd` (normalmente `7681`) |
| `xpReward` | number | ✅ | XP que gana el usuario al completar la sandbox |

---

### 4. Sincroniza con la base de datos

El servidor sincroniza los templates automáticamente en cada arranque.  
También puedes forzar la sincronización sin reiniciar desde el **Panel IT** (botón **Sync DB**) o vía API:

```bash
curl -X POST http://localhost:3001/api/v1/sandbox-templates/sync \
  -H "Authorization: Bearer <token-admin>"
```

La sandbox aparecerá en la plataforma asignada a las empresas la próxima vez que se ejecute el seed:

```bash
npm run prisma:seed
```

---

### 5. Construye la imagen (primera vez)

El servidor construye la imagen automáticamente al primer lanzamiento si no existe.  
Para pre-construir todas las imágenes de golpe:

```bash
bash docker/sandboxes/build-all.sh
```

Para construir solo la nueva:

```bash
docker build -t onboardinghub/<nombre> docker/sandboxes/<nombre>/
```

---

## Estructura de una sandbox existente (referencia)

```
docker/sandboxes/git-workflow/
├── Dockerfile           ← imagen Docker
├── metadata.json        ← info de la plataforma (title, guide, xpReward…)
└── verify-tasks.sh      ← script auxiliar copiado al contenedor
```

---

## Requisitos técnicos del contenedor

1. **`ttyd` como proceso principal** — es el puente entre el TTY del contenedor y el navegador vía WebSocket.
2. **Puerto expuesto** — usa `EXPOSE <puerto>` y configura el mismo puerto en `metadata.json → innerPort`.
3. **`ENTRYPOINT`** — debe ser `["ttyd", "-p", "<puerto>", "-W", "bash"]` (o `sh` en Alpine).

El backend mapea dinámicamente el `innerPort` a un puerto host libre, arranca el contenedor en red bridge aislada y devuelve la URL al frontend. No necesitas gestionar puertos manualmente.
