import { components, labels } from './config.mjs';
export const HISTORY_LIMIT = 60;
export function makeHistory(text, current, now = Date.now()) {
  const records = new Map(components.map(c => [c.id, new Map()]));
  const add = round => {
    if (!round || !Array.isArray(round.components)) return;
    for (const c of round.components) {
      if (!c || typeof c !== 'object') continue;
      const at = c.checkedAt || round.at;
      if (typeof at !== 'string') continue;
      const time = Date.parse(at);
      if (!records.has(c.id) || !Object.hasOwn(labels, c.status) || !Number.isFinite(time) || time > now + 60_000) continue;
      const ms = c.primary?.ms;
      records.get(c.id).set(time, { at: new Date(time).toISOString(), status: c.status, ms: Number.isFinite(ms) && ms >= 0 ? ms : null });
    }
  };
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { add(JSON.parse(line)); } catch { /* Una fila ilegible no acredita disponibilidad. */ }
  }
  add(current);
  return Object.fromEntries([...records].map(([id, samples]) => [id, [...samples.values()].sort((a,b) => Date.parse(a.at) - Date.parse(b.at)).slice(-HISTORY_LIMIT)]));
}
