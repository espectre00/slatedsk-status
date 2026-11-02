# Validación local — 2 de noviembre de 2026

Preparación local, **sin lanzamiento**. Diez pruebas del monitor y sincronización de Issues correctas (`npm test`), construcción estática correcta (`npm run build`), revisión automática y visual con Edge en escritorio y móvil de 390 px. Capturas locales no versionadas en `out/desktop.png`, `out/mobile.png`, `out/stale.png`; informe `out/browser-result.json`.

Se simularon códigos HTTP, DNS, TLS, timeout, JSON y contenido incorrectos, recurso JS servido como HTML, datos truncados, lentitud, fallo aislado, discrepancia de regiones, cuota gratuita agotada, ausencia de token, datos antiguos y fechas inválidas, caída del monitor/publicación mediante caducidad y error de carga, apertura idempotente, recuperación y conservación de incidencias breves. La simulación de Issues también prueba recuperación tras commit perdido, autor no autorizado, mantenimiento autorizado y exclusión de comentarios ajenos. La revisión en navegador comprueba arranque sin datos, verde solo con datos recientes, mantenimiento, escape de HTML, ausencia de desbordamiento móvil, datos antiguos y fallo del JSON.

En la aplicación privada, la regresión aislada de `/health` y `/ready` pasó con respuestas 200 y 503 simuladas y cabecera no-store; también pasó `npm run typecheck:server`. No se consultó una base de datos ni se cambió su esquema.

Lectura pública real a las **14:29 UTC**:

| Componente | Resultado |
|---|---|
| Web | HTTP 200, contenido válido, 266 ms |
| Aplicación | HTML y JavaScript principal válidos, 138 ms combinados |
| API | HTTP 200, falta política de caché exigida; verificación incompleta |
| Datos | HTTP 200, falta política de caché exigida; verificación incompleta |

Estas observaciones puntuales no constituyen una serie de disponibilidad ni acreditan operaciones autenticadas. `tests/live-check.mjs` permite repetir solo estas lecturas, sin Issues ni publicación. No se han incorporado resultados simulados a `site/data/status.json`: permanece sin verificar.

Pendientes externos: crear/publicar repositorio, configurar token gratuito de Globalping y comprobar su contrato real desde ambas regiones, desplegar no-store en API, habilitar Pages, DNS sin proxy y HTTPS, verificar cron y ensayo completo de apertura/cierre en repositorio de prueba. No se afirma haberlos validado. La CLI de GitHub no tiene sesión y el conector disponible no ofrece crear repositorios.
