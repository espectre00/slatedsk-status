# Reloj externo gratuito

cron-job.org inicia el workflow de GitHub; no comprueba los servicios, no recibe el token de Globalping ni aloja la web. GitHub conserva las comprobaciones, Issues, historial y publicación. El cron de Actions sigue como respaldo. La cuenta gratuita admite peticiones POST y cabeceras personalizadas.

## Configuración

Crear un único trabajo «SlateDsk status · every 5 minutes» con:

| Campo | Valor |
|---|---|
| URL | `https://api.github.com/repos/espectre00/slatedsk-status/actions/workflows/monitor.yml/dispatches` |
| Método | POST |
| Frecuencia | Cada cinco minutos, todos los días |
| Accept | `application/vnd.github+json` |
| Content-Type | `application/json` |
| X-GitHub-Api-Version | `2022-11-28` |
| Authorization | `Bearer <TOKEN_DEDICADO>` |
| Cuerpo | `{"ref":"main","inputs":{"only_if_due":true}}` |

La clave debe ser un fine-grained personal access token de GitHub dedicado, con acceso **solo** a `espectre00/slatedsk-status` y permiso **Actions: read and write**; Metadata de lectura es implícito. No conceder Contents, acceso a otros repositorios ni reutilizar la sesión de gh, tokens privados o Globalping. Guardar la clave solo en la cabecera privada de este trabajo; nunca en la URL, Git, capturas, chat ni archivos públicos. Registrar la caducidad y renovar antes de que venza. Revocarla al retirar el reloj.

No guardar cuerpos/cabeceras de respuesta en el historial del trabajo. Activar avisos gratuitos de fallo, recuperación y desactivación para la cuenta responsable. Estos avisos detectan rechazo del disparo, no acreditan que la comprobación y la publicación hayan finalizado.

## Comprobación antes de activar

1. Usar la ejecución de prueba para verificar que GitHub acepta la petición autenticada.
2. Seguir la ejecución `workflow_dispatch` correspondiente en Actions. Si hay una ronda idéntica publicada hace menos de cuatro minutos, debe omitirla. Si no, debe comprobar los cuatro componentes y publicar una nueva fecha.
3. Observar al menos dos ejecuciones posteriores iniciadas automáticamente por cron-job.org, separadas por el intervalo configurado, y comprobar las fechas tanto en Git como en el JSON servido por Pages.

Los disparos periódicos se serializan junto con las publicaciones. Antes de omitir una ronda, `src/monitor-gate.mjs` exige cuatro comprobaciones recientes, formato válido y una copia publicada idéntica al archivo de main. Datos antiguos, inaccesibles, futuros, diferentes o ilegibles obligan a comprobar. Un fallo de Pages después del commit no queda oculto. La ejecución manual sin `only_if_due` y los cambios autorizados de Issues fuerzan una ronda.

El reloj externo reduce la dependencia del programador de GitHub, pero Actions y Pages siguen siendo necesarios. El estado continúa pasando a Unverified a los quince minutos sin datos válidos; no se amplía esa vigencia.

## Recuperación

Si hay 401/403, revisar caducidad y permisos de la clave dedicada. Si hay 404, comprobar que `monitor.yml` existe en main y Actions está habilitado. Si GitHub acepta el disparo pero no publica datos, revisar la ejecución en Actions. cron-job.org puede desactivar un trabajo tras fallos repetidos; corregir la causa, rehabilitarlo y comprobar dos rondas antes de cerrar la incidencia del monitor.

Fuentes: [cron-job.org FAQ](https://cron-job.org/en/faq/), [GitHub workflow dispatch](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).
