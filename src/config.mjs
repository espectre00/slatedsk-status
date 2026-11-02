export const repository = (typeof process !== 'undefined' && process.env.GITHUB_REPOSITORY) || 'espectre00/slatedsk-status';
export const components = [
  { id: 'web', name: 'Web pública', url: 'https://slatedsk.com', kind: 'html', scope: 'Respuesta HTTPS y contenido esperado de la web pública.' },
  { id: 'app', name: 'Acceso a la aplicación', url: 'https://app.slatedsk.com', kind: 'app', scope: 'HTML y JavaScript principal accesibles. No comprueba el inicio de sesión.' },
  { id: 'api', name: 'API', url: 'https://api.slatedsk.com/health', kind: 'health', scope: 'El servidor responde con el JSON de salud esperado.' },
  { id: 'data', name: 'Conexión con datos', url: 'https://api.slatedsk.com/ready', kind: 'ready', scope: 'El servidor puede consultar su base de datos.' },
];
export const labels = { operational: 'Comprobaciones correctas', observation: 'Observación en comprobación', outage: 'Interrupción confirmada desde las ubicaciones comprobadas', partial: 'Posible incidencia parcial', degraded: 'Rendimiento degradado', incomplete: 'Verificación incompleta', unverified: 'Estado sin verificar' };
