import { fresh } from './engine.mjs';
import { labels, components as definitions } from './config.mjs';
let data = null, loadFailed = false;
const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin datos';
const el = (tag, text, className) => { const n = document.createElement(tag); if (text) n.textContent = text; if (className) n.className = className; return n; };
function render() {
  const stale = loadFailed || !fresh(data?.generatedAt);
  const states = (data?.components || definitions).map(c => ({ ...c, shown: stale || !fresh(c.lastValidAt) ? 'unverified' : c.status }));
  const priority = ['outage', 'partial', 'degraded', 'incomplete', 'unverified', 'observation', 'operational'];
  let overall = priority.find(s => states.some(c => c.shown === s)) || 'unverified';
  const manual = data?.incidents?.filter(i => i.manual && i.state === 'open') || [];
  document.querySelector('#headline').textContent = stale ? labels.unverified : manual.length ? (manual.some(i => !i.maintenance) ? 'Incidencia comunicada por el equipo' : 'Mantenimiento comunicado') : labels[overall];
  document.querySelector('#overall').dataset.state = stale ? 'unverified' : manual.length ? 'partial' : overall;
  document.querySelector('#summary-detail').textContent = stale ? 'No hay información reciente verificable. Conservamos los últimos resultados con sus fechas.' : manual.length ? 'Consulta los avisos del equipo y el alcance de las comprobaciones de cada servicio.' : overall === 'operational' ? 'Las comprobaciones públicas han respondido correctamente.' : 'Consulta los detalles de cada servicio. La causa no se atribuye automáticamente a ningún proveedor.';
  document.querySelector('#updated').textContent = `Última publicación de datos: ${date(data?.generatedAt)} · Actualización automática de esta página cada minuto.`;
  const container = document.querySelector('#components'); container.replaceChildren();
  for (const c of states) {
    const def = definitions.find(d => d.id === c.id);
    const card = el('article', null, 'service'), top = el('div', null, 'service-top'), badge = el('span', labels[c.shown], 'badge'); badge.dataset.state = c.shown;
    top.append(el('h3', c.name), badge); card.append(top, el('p', def?.scope), el('p', `Última comprobación: ${date(c.checkedAt)}${c.primary?.ms != null ? ` · ${c.primary.ms} ms desde GitHub` : ''}`));
    if (c.shown === 'unverified' || c.status === 'incomplete') card.append(el('p', `Último resultado válido: ${labels[c.lastResult?.status] || 'Sin datos'} · ${date(c.lastResult?.at)}`));
    if (c.recovering) card.append(el('p', 'Recuperación en comprobación: falta una segunda ronda satisfactoria.'));
    if (c.regions?.length) card.append(el('p', c.regions.map(r => `${r.region === 'EU' ? 'Europa' : 'Norteamérica'}${r.city ? ` (${r.city})` : ''}: ${{ ok: 'correcto', slow: 'lento', fail: 'error', unknown: 'sin verificar' }[r.status]}`).join(' · ')));
    container.append(card);
  }
  const history = document.querySelector('#incidents'); history.replaceChildren();
  if (!data) history.append(el('p', 'Historial sin verificar. Consulta el repositorio de emergencia.', 'empty'));
  else if (!data.incidents?.length) history.append(el('p', 'No hay incidencias publicadas en este historial.', 'empty'));
  for (const i of data?.incidents || []) {
    const detail = el('details'), heading = el('summary', `${i.state === 'open' ? (i.maintenance ? 'Mantenimiento' : 'Abierta') : 'Resuelta'} · ${i.title}`);
    detail.append(heading, el('p', `${date(i.createdAt)}${i.closedAt ? ` — ${date(i.closedAt)}` : ''}`), el('pre', i.body));
    for (const u of i.updates || []) detail.append(el('p', date(u.at)), el('pre', u.text));
    // Solo enlaces al repositorio conocido; ningún HTML recibido de Issues se interpreta.
    const a = el('a', 'Ver incidencia en GitHub ↗'); a.href = `https://github.com/espectre00/slatedsk-status/issues/${Number(i.number)}`; detail.append(a); history.append(detail);
  }
}
async function refresh() {
  try {
    const response = await fetch(`./data/status.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error('data');
    const next = await response.json();
    if (next.schemaVersion !== 1 || !Array.isArray(next.components) || next.components.length !== 4 || !definitions.every(d => next.components.some(c => c.id === d.id)) || next.components.some(c => !labels[c.status])) throw new Error('schema');
    data = next; loadFailed = false;
  } catch { loadFailed = true; }
  render();
}
render(); refresh(); setInterval(refresh, 60_000); setInterval(render, 10_000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
