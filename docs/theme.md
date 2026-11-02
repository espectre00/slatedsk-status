# Identidad visual

La página utiliza la identidad oscura de SlateDsk: Plus Jakarta Sans, texto #edf0f8 y acento #5558d6. El fondo combina el degradado índigo/violeta de la marca sobre negro con estrellas pequeñas y estáticas. La información se organiza en secciones abiertas y filas con separadores finos, sin tarjetas, cápsulas ni sombras decorativas.

La jerarquía del estado general y los servicios desplegables se inspira en [OpenAI Status](https://status.openai.com/) y [Notion Status](https://www.notion-status.com/); la presentación sencilla del historial toma como referencia [Claude Status](https://status.claude.com/). También se consultó https://developer.x.com/status, pero no mostró contenido visible durante la revisión. No se copian sus recursos ni sus datos de disponibilidad.

Las barras representan hasta 60 comprobaciones reales por componente, ordenadas por fecha, con las fechas y el número de registros visibles. Cada marca es una observación, no un día ni un intervalo de disponibilidad continua. Los espacios sin registros y las comprobaciones incompletas se muestran grises. No se publican porcentajes de uptime derivados de estas muestras.

La interfaz se limita al estado, fecha de comprobación, servicios e incidencias. La metodología y las referencias operativas permanecen en la documentación del repositorio, sin un bloque de alcance, pie técnico ni enlaces a herramientas en la página pública.

La interfaz pública está en inglés, con fechas en formato en-GB. El estado correcto se presenta como Operational; los datos antiguos conservan Unverified. Las nuevas incidencias automáticas y plantillas manuales también usan inglés. Los textos históricos escritos por el equipo se conservan tal como fueron publicados.

Implementación CSS independiente para la página pública; no importa ni publica módulos, hojas completas de estilos, lógica o datos de la aplicación privada. Los valores visuales seleccionados describen la identidad pública de la marca.

El logotipo y favicon proceden de los recursos ya públicos de app.slatedsk.com. Las fuentes Plus Jakarta Sans se alojan aquí con su licencia SIL Open Font License en `site/assets/fonts/OFL.txt`. No hay peticiones al VPS ni a proveedores de fuentes para mostrar estos recursos.
