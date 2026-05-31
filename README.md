# IPTV Player Premium 📺

Una aplicación web moderna, rápida y responsiva para reproducir canales de televisión en vivo y contenido multimedia desde listas de reproducción IPTV (HLS/M3U8). Optimizada para navegadores de escritorio, dispositivos móviles y compatible con controles de Smart TV / Android TV.

Este proyecto puede alojarse directamente en **GitHub Pages** de forma gratuita.

---

## 🚀 Características

* **Interfaz de Usuario Premium:** Diseño moderno con modo oscuro, animaciones suaves y adaptabilidad total (responsive).
* **Filtros Inteligentes:** Explora canales organizados automáticamente por categorías (Películas, Documentales, Noticias, Deportes), países e idiomas.
* **Sistema de Favoritos:** Guarda tus canales preferidos de forma local (almacenamiento en el navegador).
* **Compatible con Android TV:** Soporte completo de navegación mediante D-Pad / teclado para usar con controles remotos.
* **Aplicación Web Progresiva (PWA):** Instálala en tu dispositivo móvil o de escritorio como si fuera una aplicación nativa.
* **Soporte HLS (.m3u8):** Integración nativa del reproductor `HLS.js` para una transmisión estable y de baja latencia.

---

## 🛠️ Cómo desplegar en GitHub Pages

Para publicar esta aplicación y que se vea online como tu propia plataforma de streaming:

1. **Sube los archivos a tu repositorio de GitHub.**
2. Ve a la pestaña **Settings** (Configuración) de tu repositorio.
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En la sección **Build and deployment**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)` como origen.
5. Haz clic en **Save** (Guardar).
6. En unos minutos, GitHub te dará un enlace público (ej. `https://tu-usuario.github.io/nombre-del-repositorio/`) donde la app estará 100% operativa.

---

## 💻 Ejecución en Local

Si deseas probar la aplicación de forma local en tu computadora:

1. Asegúrate de tener instalado [Node.js](https://nodejs.org/).
2. Abre la terminal en la carpeta del proyecto.
3. Inicia el servidor de desarrollo:
   ```bash
   node server.js
   ```
4. Abre [http://localhost:8080](http://localhost:8080) en tu navegador.

---

## 📂 Estructura de Archivos Principal

* `index.html` - Estructura HTML5 semántica y optimizada.
* `style.css` - Estilos modernos con variables CSS, animaciones y diseño premium.
* `app.js` - Controlador principal en JavaScript (lógica de filtros, favoritos, D-pad y reproductor).
* `channels_with_streams.json` - Base de datos de canales y transmisiones en vivo en formato JSON.
* `playlist.m3u` - Lista de canales en formato estándar M3U compatible con reproductores externos (VLC, IPTV players).
* `logos/` - Carpeta local que contiene los logotipos optimizados de los canales.
