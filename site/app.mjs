import { fresh } from './engine.mjs';
import { labels, components as definitions } from './config.mjs';
let data = null, loadFailed = false;
const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin datos';
const stamp = value => new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });
const el = (tag, text, className) => { const n = document.createElement(tag); if (text) n.textContent = text; if (className) n.className = className; return n; };
function historyStrip(id) {
  const samples = (Array.isArray(data?.history?.[id]) ? data.history[id] : []).filter(s => s && Number.isFinite(Date.parse(s.at)) && Object.hasOwn(labels,s.status)).slice(-60);
  const wrap=el('div',null,'history-strip'), bars=el('div',null,'history-bars');
  bars.setAttribute('role','img');
  const counts = samples.reduce((out,s) => {out[labels[s.status]]=(out[labels[s.status]]||0)+1;return out;},{});
  bars.setAttribute('aria-label', samples.length ? `${samples.length} comprobaciones reales. ${Object.entries(counts).map(([state,n])=>`${state}: ${n}`).join('. ')}. De ${stamp(samples[0].at)} a ${stamp(samples.at(-1).at)}.` : 'Aún no hay historial de comprobaciones publicado.');
  for(let n=0;n<60-samples.length;n++) {const bar=el('span',null,'history-bar');bar.title='Sin datos';bars.append(bar);}
  for(const sample of samples) {const bar=el('span',null,'history-bar');bar.dataset.state=sample.status;bar.title=`${stamp(sample.at)} · ${labels[sample.status]}${sample.ms != null ? ` · ${sample.ms} ms` : ''}`;bars.append(bar);}
  const range=el('div',null,'history-range');
  range.append(el('span', samples.length ? `${samples.length} registros · ${stamp(samples[0].at)}` : 'Sin historial publicado'),el('span',samples.length ? stamp(samples.at(-1).at) : 'Sin datos'));
  wrap.append(bars,range);return wrap;
}
function render() {
  const stale = loadFailed || !fresh(data?.generatedAt);
  const states = (data?.components || definitions).map(c => ({ ...c, shown: stale || !fresh(c.lastValidAt) ? 'unverified' : c.status }));
  const priority = ['outage', 'partial', 'degraded', 'incomplete', 'unverified', 'observation', 'operational'];
  const overall = priority.find(s => states.some(c => c.shown === s)) || 'unverified';
  const manual = data?.incidents?.filter(i => i.manual && i.state === 'open') || [];
  document.querySelector('#headline').textContent = stale ? labels.unverified : manual.length ? (manual.some(i => !i.maintenance) ? 'Incidencia comunicada por el equipo' : 'Mantenimiento comunicado') : labels[overall];
  document.querySelector('#overall').dataset.state = stale ? 'unverified' : manual.length ? 'partial' : overall;
  document.querySelector('#summary-detail').textContent = stale ? 'No hay una comprobación reciente.' : manual.length ? 'Consulta la incidencia publicada.' : overall === 'operational' ? '' : 'Consulta los servicios afectados.';
  document.querySelector('#updated').textContent = `Última comprobación: ${date(data?.generatedAt)}`;
  const container = document.querySelector('#components');
  const expanded = new Set([...container.querySelectorAll('details[open]')].map(n=>n.dataset.component));
  container.replaceChildren();
  for (const c of states) {
    const def = definitions.find(d => d.id === c.id);
    const row=el('article',null,'service'),detail=el('details',null,'service-detail'),top=el('summary',null,'service-top');
    detail.dataset.component=c.id;detail.open=expanded.has(c.id);
    const name=el('div',null,'service-name'),arrow=el('span','›','chevron');arrow.setAttribute('aria-hidden','true');name.append(arrow,el('h3',c.name));
    const badge=el('span',labels[c.shown],'badge');badge.dataset.state=c.shown;top.append(name,badge);
    const body=el('div',null,'service-details');
    body.append(el('p',def?.scope),el('p',`Última comprobación: ${date(c.checkedAt)}${c.primary?.ms != null ? ` · ${c.primary.ms} ms` : ''}`));
    if (c.shown === 'unverified' || c.status === 'incomplete') body.append(el('p',`Último resultado válido: ${labels[c.lastResult?.status] || 'Sin datos'} · ${date(c.lastResult?.at)}`));
    if (c.recovering) body.append(el('p','Recuperación en comprobación: falta una segunda ronda satisfactoria.'));
    if (c.regions?.length) body.append(el('p',c.regions.map(r=>`${r.region==='EU'?'Europa':'Norteamérica'}${r.city?` (${r.city})`:''}: ${{ok:'correcto',slow:'lento',fail:'error',unknown:'sin verificar'}[r.status]}`).join(' · ')));
    detail.append(top,body);row.append(detail,historyStrip(c.id));container.append(row);
  }
  const history = document.querySelector('#incidents');
  const openIncidents=new Set([...history.querySelectorAll('details[open]')].map(n=>n.dataset.incident));
  history.replaceChildren();
  if (!data) history.append(el('p','Historial sin verificar.','empty'));
  else if (!data.incidents?.length) {
    const empty=el('div',null,'empty');empty.append(el('p','No hay incidencias publicadas.','empty-title'));history.append(empty);
  }
  for (const i of data?.incidents || []) {
    const article=el('article',null,'incident');
    article.append(el('p',date(i.createdAt),'incident-date'));
    const detail=el('details',null,'incident-detail');detail.dataset.incident=String(i.number);detail.open=openIncidents.has(String(i.number));
    const heading=el('summary'),tag=el('span',i.state==='open'?(i.maintenance?'Mantenimiento':'Abierta'):'Resuelta','incident-state');tag.dataset.state=i.state==='closed'?'operational':i.maintenance?'maintenance':'partial';
    heading.append(tag,el('span',i.title,'incident-title'));detail.append(heading);
    const body=i.manual ? i.body : (i.body || '').replace(/<!-- slatedsk-monitor:[^>]+-->/g,'').split('Evidencia pública:')[0].trim();
    detail.append(el('pre',body));
    for (const u of i.updates || []) detail.append(el('p',date(u.at),'update-date'),el('pre',u.text));
    if(i.closedAt)detail.append(el('p',`Resuelta: ${date(i.closedAt)}`));
    article.append(detail);history.append(article);
  }
}
async function refresh() {
  try {
    const response = await fetch(`./data/status.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error('data');
    const next = await response.json();
    if (next.schemaVersion !== 1 || !Array.isArray(next.components) || next.components.length !== 4 || !definitions.every(d => next.components.some(c => c.id === d.id)) || next.components.some(c => !Object.hasOwn(labels,c.status))) throw new Error('schema');
    data = next; loadFailed = false;
  } catch { loadFailed = true; }
  render();
}
render(); refresh(); setInterval(refresh, 60_000); setInterval(render, 10_000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
