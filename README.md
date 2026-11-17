# Gamificar en el aula · Taller en vivo

Presentación web animada (37 escenas) para el taller de gamificación, con los celulares de los profes conectados por QR: quiz con puntos y ranking, encuestas en vivo, nube de ideas, *Find someone who* y podio final.

- **Presentador:** `/host?key=TU_CLAVE` (la clave está en la variable de entorno `HOST_KEY`)
- **Jugadores:** la raíz `/` (el QR de la portada apunta ahí)

## Teclas del presentador
→ / Espacio: siguiente · ←: anterior · **Enter**: revelar resultados · F: pantalla completa · Q: mostrar QR · M: sonido · ☰ (abajo a la derecha): ir a escena, repetir actividad, reiniciar.

## Variables de entorno
- `HOST_KEY` — clave del presentador
- `SHARKBAIT_URL` — enlace del QR de la demo (por defecto shark-bait-j1hs.onrender.com)

## Editar contenido
Todo el texto y las preguntas están en `content.js`.

## Local
```
npm install
npm start
```
