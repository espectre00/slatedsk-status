# Estado público de SlateDsk

[Página de estado](https://status.slatedsk.com) · [Incidencias](https://github.com/espectre00/slatedsk-status/issues)

Repositorio de emergencia independiente de la aplicación. Comprueba web, HTML/JavaScript de acceso, salud de API y conexión con datos. No garantiza login, facturación ni todas las operaciones.

<!-- live:start -->
**Estado sin verificar.** Todavía no se han publicado comprobaciones reales.
<!-- live:end -->

Una ronda tiene vigencia de 15 minutos. Lee SIEMPRE su fecha: GitHub puede retrasar o detener las automatizaciones. El README conserva el último resultado y no puede cambiar por sí solo cuando el monitor está detenido. La página detecta antigüedad también en el navegador.

Base: [Upptime](https://github.com/upptime/upptime), con monitor propio para confirmación regional, recuperación y datos antiguos. GitHub Pages, Actions e Issues; Globalping gratuito para contraste ante anomalías. Sin servicios de pago ni recursos del VPS en la página de estado.

Estado de preparación: implementación local; publicación, DNS, HTTPS, token y ensayo externo de incidencias pendientes hasta completar [la puerta de lanzamiento](docs/runbook.md).

- [Arquitectura, contratos y límites](docs/architecture.md)
- [Publicación, mantenimiento y recuperación](docs/runbook.md)
- [Datos públicos versionados](site/data/status.json)

Validación sin acceder a producción: `npm test` y `npm run build`. Revisión visual: `node tests/browser-review.mjs` con Playwright disponible. No hay dependencias de ejecución. Se conserva la licencia MIT de la plantilla.
