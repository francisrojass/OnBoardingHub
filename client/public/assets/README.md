Coloca aquí las imágenes usadas por la aplicación. Vite sirve `public/` como archivos estáticos desde la raíz (`/assets/<file>`).

Ficheros esperados (colócalos exactamente con estos nombres):

- logo.svg
  - Uso: barra de navegación (al lado del título).
  - Recomendado: SVG (vector). Altura visible: 36px. Nombre: `logo.svg`.

- welcome-bg.png
  - Uso: fondo hero de la página Welcome.
  - Recomendado: PNG/JPG, ~1600×600 px, ligera opacidad/mínimo contraste, estilo minimalista blanco.
  - Nombre: `welcome-bg.png`.

- welcome-photo.jpg
  - Uso: foto/ilustración dentro de la tarjeta Welcome, a la derecha.
  - Recomendado: JPG/PNG, ~800×600 px (o 600×400), buena compresión y recorte centrado.
  - Nombre: `welcome-photo.jpg`.

- empty-boxes.png
  - Uso: ilustración del estado vacío en Dashboard.
  - Recomendado: PNG/JPG/SVG, ~800×400 px, estilo minimal/line-art.
  - Nombre: `empty-boxes.png`.

Cómo comprobar en la app (rutas públicas):
- Logo: /assets/logo.svg
- Welcome background: /assets/welcome-bg.png
- Welcome photo: /assets/welcome-photo.jpg
- Empty state: /assets/empty-boxes.png

Pasos para añadirlas localmente:
1. Copia tus imágenes en `client/public/assets/` con los nombres indicados.
2. (Re)inicia el server de desarrollo si no se actualiza automáticamente:
   cd client
   npm run dev
3. Abre http://localhost:5173 y comprueba:
   - Logo en la barra de navegación
   - Welcome: fondo y foto
   - Dashboard vacío: ilustración y mensaje

Si prefieres que las procese Vite (cache-busting/hashed filenames) puedo mover las imágenes a `client/src/assets/` e importarlas desde componentes — dime si quieres eso.
