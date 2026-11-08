# Estado público de SlateDsk

[Página de estado](https://status.slatedsk.com) · [Incidencias](https://github.com/espectre00/slatedsk-status/issues)

Repositorio de emergencia independiente de la aplicación. Comprueba web, HTML/JavaScript de acceso, salud de API y conexión con datos. No garantiza login, facturación ni todas las operaciones.

<!-- live:start -->
Última ronda: **2026-11-08T16:10:42.550Z**. Tras 15 minutos este resumen debe considerarse **sin verificar**.

| Componente | Último resultado |
|---|---|
| Web pública | Operational |
| Acceso a la aplicación | Operational |
| API | Operational |
| Conexión con datos | Operational |

[Incidencias y actualizaciones](https://github.com/espectre00/slatedsk-status/issues) · [Datos con fechas y regiones](site/data/status.json)
<!-- live:end -->

Una ronda tiene vigencia de 15 minutos. Lee SIEMPRE su fecha: GitHub puede retrasar o detener las automatizaciones. El README conserva el último resultado y no puede cambiar por sí solo cuando el monitor está detenido. La página detecta antigüedad también en el navegador.

Base: [Upptime](https://github.com/upptime/upptime), con monitor propio para confirmación regional, recuperación y datos antiguos. GitHub Pages, Actions e Issues; Globalping gratuito para contraste ante anomalías. Sin servicios de pago ni recursos del VPS en la página de estado.

Publicado en [status.slatedsk.com](https://status.slatedsk.com/) con DNS directo a GitHub Pages y HTTPS obligatorio verificados. Globalping, el ensayo real de incidencias y no-store en la API están comprobados. Un [reloj externo gratuito](docs/external-scheduler.md) inicia Actions cada cinco minutos y evita depender solo del cron de GitHub, donde se observaron intervalos de varias horas. Dos disparos automáticos y una nueva publicación están verificados. Véase [la evidencia](docs/validation.md) y [la puerta de lanzamiento](docs/runbook.md).

- [Arquitectura, contratos y límites](docs/architecture.md)
- [Publicación, mantenimiento y recuperación](docs/runbook.md)
- [Datos públicos versionados](site/data/status.json)

Validación sin acceder a producción: `npm test` y `npm run build`. Revisión visual: `node tests/browser-review.mjs` con Playwright disponible. No hay dependencias de ejecución. Se conserva la licencia MIT de la plantilla.
