# Operación de status.slatedsk.com

## Primera publicación

1. Publicar primero el cambio `Cache-Control: no-store` de los endpoints existentes de la API privada. No hay migraciones ni endpoints nuevos. Comprobar `/health` y `/ready` con HTTPS y sin caché; antes de este despliegue el monitor rechazará sus respuestas cacheables.
2. Crear **espectre00/slatedsk-status**, público y sin inicializar README. Publicar únicamente este directorio, nunca el workspace padre. La plantilla tiene remoto upstream eliminado para impedir pushes accidentales. Rama objetivo main: `git branch -M main`, `git remote add origin https://github.com/espectre00/slatedsk-status.git`, `git add .`, `git commit -m 'feat: add verified public status page'`, `git push -u origin main`. Revisar los archivos antes del commit; no incluir secretos.
3. En Settings → Pages elegir GitHub Actions. Permitir al workflow escribir contenidos e Issues. Revisar reglas de rama para que su commit de resultados pueda entrar en main; si está bloqueado, no publicará datos nuevos.
4. Crear cuenta gratuita de Globalping y token dedicado, guardado como secret `GLOBALPING_TOKEN`. No comprar créditos ni activar planes de pago. Falta de token solo impide confirmar anomalías, no se publica como caída. No guardar el token en Git, JSON, Issues o variables públicas.
5. Crear etiquetas `status-published` y `maintenance`. Conceder acceso de escritura solo al equipo autorizado. Suscribir responsables mediante Watch → Custom → Issues y fallos de Actions según preferencias de GitHub.
6. Ejecutar «Comprobar y publicar estado» manualmente y comprobar que datos, README, Issues y Pages se actualizan. Verificar también al menos una ejecución posterior por cron.
7. En Cloudflare, CNAME `status` → `espectre00.github.io`, **solo DNS** (nube gris). Eliminar registros incompatibles para ese nombre. En Pages configurar `status.slatedsk.com`, verificar dominio y activar Enforce HTTPS cuando el certificado esté disponible. Comprobar resolución pública, certificado válido y ausencia de proxy; no desactivar barreras TLS para probarlo.
8. Abrir móvil y escritorio. La página debe mostrar resultados fechados, alcance y acceso de emergencia. Confirmar que al bloquear JSON o adelantar el reloj >15 min desaparece el verde.
9. Hacer un ensayo de apertura/actualización/cierre en un repositorio de ensayo con destinos de prueba. Inyectar errores solo en ese repositorio y en sus pruebas; nunca cambiar producción para provocar una incidencia. No lanzar hasta completar apertura y dos rondas regionales de recuperación, sin duplicados, y registrar la ejecución de ensayo.

## Explicación o mantenimiento

Abrir el formulario de Issue correspondiente desde una cuenta autorizada. Indicar componentes, impacto, situación, próxima actualización y zona horaria. Escribir «causa pendiente de confirmar» hasta disponer de evidencia propia. Añadir `status-published`; para mantenimiento, también `maintenance`. Añadir comentarios para actualizaciones. Cerrar para resolver. Un aviso general de Cloudflare u otro proveedor no prueba impacto en SlateDsk.

Si un colaborador necesita publicar sobre un reporte externo, debe crear un aviso propio: etiquetar un Issue de un usuario sin permiso no lo publica. Los comentarios de visitantes tampoco se publican. Puede haber retraso hasta el siguiente workflow exitoso.

## Publicación manual y recuperación

Usar Run workflow en Actions. Si falló publicación después del commit, repetir el workflow completo: sincroniza de nuevo sin duplicar avisos. Si falló el commit después de crear un Issue, el siguiente recorrido recupera ese aviso y vuelve a comprobar recuperación. No cerrar avisos automáticos a mano; explicar en un comentario autorizado y dejar que dos rondas los cierren.

Si una ejecución falla: revisar primero el paso fallido y permisos de contents/issues/pages, reglas de rama, entorno github-pages y disponibilidad del secret. No copiar secretos en tickets. Errores Globalping o cuota deben figurar como incompletos, nunca como interrupción confirmada. Reponer un token revocado desde Settings → Secrets. No comprar cuota para solucionar el bloqueo.

Si cron deja de ejecutarse, abrir Actions, rehabilitar el workflow cuando GitHub lo haya desactivado y ejecutar manualmente. Comprobar nuevas fechas tanto en Git como en Pages; un commit reciente por sí solo no demuestra que Pages se haya publicado. Verificar dos rondas si había incidencia abierta.

## Acceso de emergencia

Usar `https://github.com/espectre00/slatedsk-status`, leer la fecha del resumen y los Issues. **Después de 15 minutos el resumen no acredita el estado actual**, aunque sus palabras indiquen que la última ronda fue correcta. GitHub no puede actualizar un README cuando Actions está detenido. Si GitHub también falla, esta solución no proporciona un canal independiente adicional.

## Validación local

`npm test` y `npm run build` no usan producción ni requieren secretos. Las pruebas simulan HTTP, DNS, TLS, contenido, cache, cuota, sondas, recuperación e Issues. Para revisión visual, con Playwright instalado: `PLAYWRIGHT_MODULE` puede señalar el módulo local de Playwright, luego ejecutar `node tests/browser-review.mjs`. Genera capturas en `out/` y valida móvil, datos antiguos, avisos manuales, errores de JSON y escape de texto. No ejecuta el monitor real ni crea Issues externos.

## Puerta de lanzamiento

No marcar el lanzamiento completo hasta registrar: commit y URL pública, DNS solo DNS, HTTPS válido, ejecución por cron, token gratuito funcional, no-store desplegado, ensayo real de apertura y cierre en repositorio de prueba y revisión móvil. Los tests locales no sustituyen esas comprobaciones externas.
