# Arquitectura y decisiones

Repositorio independiente basado en la plantilla pública [Upptime](https://github.com/upptime/upptime), revisión `e02fd03bea5c18e312316be959c40f7f2f42708c` (v1.46.5 en su workflow). Conserva licencia MIT, configuración `.upptimerc.yml` y formato de snapshots `history/*.yml`. La copia de referencia del workflow original está en `upstream-uptime.yml.txt`, fuera de Actions. No contiene código de la aplicación privada.

Es un fork deliberado: el monitor y la página originales de Upptime se sustituyen para controlar confirmación, recuperación, frescura y publicación. No se ejecuta `upptime/uptime-monitor update`: abriría incidencias desde una comprobación individual. No se activan actualizaciones automáticas de plantilla que puedan sobrescribir esta política. La configuración ejecutable de los contratos está en `src/config.mjs`; mantener alineada `.upptimerc.yml` al cambiar componentes.

Los snapshots YAML conservan la estructura de Upptime, con una extensión propia: `status` admite `unknown` y `slatedskStatus` conserva el estado detallado. Solo una interrupción confirmada genera `down`; una verificación incompleta no se convierte en caída. El contrato canónico completo es el JSON público, no un indicador binario de Upptime.

El repositorio se publica con historial nuevo, sin commits heredados ni archivos del repositorio privado. `npm run audit:public` controla rutas permitidas, archivos sensibles y patrones de credenciales antes de publicar. Solo informa ruta, línea y regla; nunca imprime el valor detectado. No sustituye la revisión del contenido manual que el equipo decide hacer público en Issues.

## Flujo

Un único workflow serializado comprueba desde GitHub, repite ante error o >5 s y contrasta con una sonda en Europa y otra en Norteamérica. Durante una incidencia activa también contrasta rondas correctas. Valida HTTPS con confianza TLS del sistema, HTTP 200, tipo de contenido y marcadores públicos. Aplicación exige su script module principal del mismo origen y contenido con tipo JavaScript. Salud usa GET con parámetro único, petición sin caché, JSON estricto, respuesta no-store y rechazo de Age positivo. No sigue redirecciones: una respuesta inesperada requiere revisión.

Matriz: fallo en origen, repetición y ambas regiones = interrupción confirmada en esas ubicaciones. Si la repetición y ambas regiones salen bien = observación aislada. Si la lentitud se repite sin errores = degradación. Contradicciones = posible incidencia parcial. Sondas desconocidas, errores internos, cuota o contenido regional truncado insuficiente = verificación incompleta. No atribuye causas a proveedores.

Dos rondas correctas contiguas cierran el aviso. Una ronda incompleta corta la racha. Huecos de más de 15 minutos reinician la racha. Los Issues actúan como diario adicional si falla el commit posterior a la apertura. Los avisos cerrados nunca se borran. Las comprobaciones incompletas conservan el último resultado válido y su fecha.

`site/data/status.json` tiene `schemaVersion`, `generatedAt`, componentes con `checkedAt`, `lastValidAt`, `lastResult`, resultados de GitHub, repetición, regiones, mediciones e incidencias con actualizaciones. `history/rounds.ndjson` conserva rondas en Git; no almacena cuerpos HTTP, IPs, cabeceras sensibles ni datos de clientes. No se calculan porcentajes de disponibilidad sobre periodos sin muestras.

El campo adicional `history` del JSON contiene hasta 60 observaciones por componente, reconstruidas desde el registro real más la ronda actual. Solo publica fecha, estado y tiempo de respuesta. Ordena y deduplica por fecha; rechaza estados/componentes desconocidos y fechas inválidas o futuras. La página muestra esas muestras como barras con leyenda y mantiene gris cualquier ausencia de registros. Este historial no altera la clasificación ni la política de recuperación del monitor.

Primero sincroniza Issues, después versiona datos y README, y solo entonces despliega Pages. Un fallo de Issues impide publicar una ronda incompleta como correcta. Si falla commit o publicación, el sitio conserva sus fechas antiguas y deja de mostrar verde al caducar; el resumen del repositorio exige leer su fecha. El navegador comprueba antigüedad cada 10 s, consulta JSON cada minuto y al recuperar visibilidad. Un error al cargar datos desactiva el verde inmediatamente.

## Globalping y coste

Requiere cuenta gratuita con token dedicado, sin compras de créditos ni suscripción. Consulta `/v1/limits` antes de cada POST; rechaza cuota desconocida o menos de 20 pruebas gratuitas restantes. Máximo 12 pruebas por ronda, una sonda por medición y sin reintentar POST; en el peor caso normal son 10 pruebas (HTML y JS de app cuentan por separado), 120/h con cron puntual. La consulta real de cuota protege también ejecuciones manuales. No se configura facturación. No compartir token con otras automatizaciones: las comprobaciones de cuota no son una reserva atómica.

Globalping devuelve como máximo 10 kB de cuerpo: cuando no basta para validar HTML, el resultado es desconocido. Errores `internal`, `resolver`, sondas offline o sin región esperada nunca confirman una caída. Los resultados regionales describen una muestra de dos ubicaciones, no continentes completos.

## Publicación manual y confianza

Solo Issues de autores con permiso efectivo write/maintain/admin y etiqueta `status-published` aparecen como avisos manuales. `maintenance` distingue mantenimientos. Solo se incorporan comentarios del bot de Actions o de colaboradores con esos permisos. El texto se presenta con textContent; no se interpreta HTML ni Markdown externo. Los Issues automáticos se identifican por bot y marcador por componente. No hay código ejecutable ni secretos interpolados desde títulos o comentarios.

El mantenimiento se publica como aviso con ventana explícita en el texto, hasta que el equipo cierre el Issue; no se ocultan las mediciones reales. Los avisos manuales abiertos evitan un estado general verde, incluso si las sondas responden bien.

## Dependencias y límites

Node 22, sin paquetes de ejecución ni fuentes externas. GitHub Actions y Pages en repositorio público; runners Ubuntu estándar. cron-job.org inicia `workflow_dispatch` cada cinco minutos mediante una clave dedicada con Actions write limitada al repositorio público de estado; el cron de Actions se conserva como respaldo. No se trasladan las comprobaciones al reloj externo. La exclusión mutua y `src/monitor-gate.mjs` evitan rondas duplicadas únicamente si el snapshot completo publicado coincide con main y sus cuatro comprobaciones tienen menos de cuatro minutos. Un fallo de publicación o de lectura obliga a ejecutar. Pushes, Issues autorizados y ejecuciones manuales sin `only_if_due` fuerzan una ronda. Configuración y renovación en [external-scheduler.md](external-scheduler.md).

La programación pretende cinco minutos, sin puntualidad garantizada. GitHub puede desactivar cron tras inactividad: revisar y rehabilitar según el runbook. cron-job.org, GitHub y Globalping son dependencias externas. Una petición de disparo aceptada no acredita que la ejecución o la publicación hayan terminado. No hay pruebas autenticadas ni garantía de login, facturación u operaciones completas.

Referencias verificadas: [configuración de Upptime](https://upptime.js.org/docs/configuration/), [API y límites de Globalping](https://github.com/jsdelivr/globalping/blob/master/public/v1/spec.yaml), [contratos de mediciones](https://github.com/jsdelivr/globalping/blob/master/public/v1/components/schemas.yaml).
