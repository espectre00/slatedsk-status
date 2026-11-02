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

## Primera publicación

Repositorio público creado con historial nuevo y commit inicial `0e84d5230f76ce6489081dd2ed92629fe0cdee67`, sin commits de la plantilla ni archivos privados. Auditoría de 33 archivos sin patrones de credenciales detectados. El workflow ejecuta también la auditoría antes y después de generar datos. No publica mensajes de error de servidores, cuerpos HTTP, IPs ni valores de secretos.

Primera ejecución real [41463514189](https://github.com/espectre00/slatedsk-status/actions/runs/41463514189), completada correctamente: pruebas, auditorías, comprobaciones desde GitHub, commit de resultados y despliegue en Pages. Etiquetas de avisos preparadas. Acceso provisional: https://espectre00.github.io/slatedsk-status/.

Dominio definitivo verificado: `status.slatedsk.com` tiene CNAME a `espectre00.github.io`; la comprobación DNS de GitHub indica dominio válido y sin proxy. Certificado aprobado para ese nombre y HTTPS obligatorio activado. Lecturas HTTPS normales, sin omitir validación de certificado: página HTTP 200 con título esperado y JSON schemaVersion 1 con cuatro componentes.

Pendientes externos: configurar token gratuito de Globalping y comprobar su contrato real desde ambas regiones, desplegar no-store en API, verificar cron y ensayo completo de apertura/cierre en repositorio de prueba. No se afirma haber validado estas condiciones de lanzamiento.
