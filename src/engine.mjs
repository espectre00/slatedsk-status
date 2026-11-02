export const STALE_MS = 900_000;
export const incidentStates = new Set(['outage', 'partial', 'degraded']);
export function fresh(date, now = Date.now()) {
  const age = now - Date.parse(date);
  return Number.isFinite(age) && age >= -60_000 && age <= STALE_MS;
}
export function classify(primary, retry, regions) {
  if (primary.status === 'ok' && !retry) return 'operational';
  if (!retry || primary.status === 'unknown' || retry.status === 'unknown') return 'incomplete';
  if (regions.length !== 2 || !['EU', 'NA'].every(r => regions.some(x => x.region === r && x.status !== 'unknown'))) return 'incomplete';
  const values = [primary, retry, ...regions].map(x => x.status);
  if (values.every(x => x === 'fail')) return 'outage';
  if (values.every(x => x === 'ok' || x === 'slow') && primary.status === 'slow' && retry.status === 'slow') return 'degraded';
  if (retry.status === 'ok' && regions.every(x => x.status === 'ok')) return 'observation';
  return 'partial';
}
export function transition(previous = {}, round, at) {
  const contiguous = fresh(previous.checkedAt, Date.parse(at));
  const good = round.status === 'operational' ? (contiguous ? previous.goodRounds || 0 : 0) + 1 : 0;
  const recovering = previous.activeIncident && good < 2;
  return { ...previous, ...round, firstCheckedAt: previous.firstCheckedAt || at, checkedAt: at, lastValidAt: round.status === 'incomplete' ? previous.lastValidAt || null : at,
    lastResult: round.status === 'incomplete' ? previous.lastResult || null : { status: round.status, at }, goodRounds: good,
    activeIncident: incidentStates.has(round.status) || Boolean(recovering),
    status: recovering && round.status === 'operational' ? previous.status : round.status, recovering: Boolean(recovering && good) };
}
