# Crear Sandboxes Personalizadas para OnBoardingHub

OnBoardingHub abstrae la ejecución de terminales interactivas en el navegador. Para que el sistema interactúe con cualquier imagen Docker, sólo necesitas cumplir con una regla: **El contenedor debe ejecutar `ttyd` y exponer su puerto interno.**

## Requisitos de una Sandbox

1. **Base Image:** Puedes usar cualquier imagen base (`ubuntu`, `alpine`, `node`, `python`, etc.).
2. **Dependencias:** Instala las herramientas que la sandbox requiera (ej. `git`, el entorno de ejecución, bases de datos en memoria, etc).
3. **Instalar `ttyd`:** Es el puente entre los procesos TTY del contenedor y WebSockets. En distribuciones como Ubuntu 22.04+ o Alpine, puedes instalarlo usando el gestor de paquetes (ej. `apt-get install ttyd` o `apk add ttyd`).
4. **Exponer Puerto:** Usa la instrucción `EXPOSE` en el Dockerfile para documentar el puerto interno (típicamente `7681`). 
5. **Entrypoint:** Configura `ttyd` como proceso principal, estableciendo el puerto y la terminal (ej. `bash` o `sh`). Recomendable usar la flag `-W` para permitir escritura si la versión de `ttyd` lo requiere.

## Ejemplo Básico

```dockerfile
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    ttyd \
    git \
    nano \
    && rm -rf /var/lib/apt/lists/*
EXPOSE 7681
WORKDIR /root
# Lanza ttyd en el puerto 7681 de forma interactiva (-W) usando bash
ENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]
```

## Registro en OnBoardingHub

Una vez creada y construida/publicada tu imagen (ej. `mi-empresa/sandbox-avanzada`), debes registrarla en la base de datos de OnBoardingHub:

En la tabla `Box`:
- `dockerImage`: `"mi-empresa/sandbox-avanzada"`
- `innerPort`: `7681` (o el que hayas configurado en `ttyd`)
- `title`, `description`, `objectives`: Textos que se mostrarán al usuario.

¡Y ya está! El backend `sandbox.service.ts` se encargará dinámicamente de mapear el `innerPort` a un puerto host disponible, arrancar el contenedor aislado en modo bridge, y devolver al frontend la conexión WebSocket lista para usar.
