import { readFile, appendFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { components, labels } from './config.mjs';

// El reloj externo y cron comparten exclusión mutua en Actions. Cuatro minutos
// evitan repetir una ronda recién publicada sin saltarse el siguiente intervalo.
export const MIN_ROUND_MS = 240_000;
const periodic = (event, onlyIfDue) => event === 'schedule' || event === 'workflow_dispatch' && onlyIfDue === 'true';
function recent(snapshot, now) {
  const withinWindow = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && now - Date.parse(value) >= 0 && now - Date.parse(value) < MIN_ROUND_MS;
  return snapshot?.schemaVersion === 1 && withinWindow(snapshot.generatedAt) &&
    Array.isArray(snapshot.components) && snapshot.components.length === components.length &&
    components.every(def => snapshot.components.filter(c => c?.id === def.id).length === 1) &&
    snapshot.components.every(c => Object.hasOwn(labels, c.status) && withinWindow(c.checkedAt));
}

export function shouldRun(event, onlyIfDue, stored, published, now = Date.now()) {
  if (!periodic(event, onlyIfDue)) return true;
  // Un commit reciente no demuestra que Pages tenga esa ronda. Comparar ambos
  // evita omitir la recuperación de una publicación fallida.
  return !(recent(stored, now) && recent(published, now) && isDeepStrictEqual(stored, published));
}

export async function decideRun({ event, onlyIfDue, now = Date.now(), read = readFile, fetcher = fetch }) {
  if (!periodic(event, onlyIfDue)) return true;
  try {
    const stored = JSON.parse(await read('site/data/status.json', 'utf8'));
    if (!recent(stored, now)) return true;
    const response = await fetcher(`https://status.slatedsk.com/data/status.json?gate=${now}`, {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return true;
    return shouldRun(event, onlyIfDue, stored, await response.json(), now);
  } catch {
    // Ante datos ausentes, ilegibles o una publicación inaccesible, comprobar.
    return true;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = await decideRun({ event: process.env.GITHUB_EVENT_NAME, onlyIfDue: process.env.INPUT_ONLY_IF_DUE });
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
  await appendFile(process.env.GITHUB_OUTPUT, `run=${run}\n`);
  console.log(run ? 'A new check and publication are required.' : 'The same recent round is already published; skipping duplicate.');
}
