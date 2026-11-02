import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { components, labels, repository } from './config.mjs';
import { check } from './check.mjs';
import { classify, transition } from './engine.mjs';
import { Globalping } from './globalping.mjs';
import { GitHub } from './github.mjs';
if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN requerido; usar npm test para simulaciones sin red.');
const at = new Date().toISOString();
let previous;
try { previous = JSON.parse(await readFile('site/data/status.json', 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; previous = { components: [] }; }
const globalping = new Globalping(process.env.GLOBALPING_TOKEN);
const result = [];
for (const component of components) {
  const before = previous.components.find(c => c.id === component.id);
  const primary = await check(component);
  let retry = null, regions = [];
  // Una incidencia activa también se contrasta regionalmente durante la recuperación.
  if (primary.status !== 'ok' || before?.activeIncident) {
    retry = await check(component);
    for (const region of ['EU', 'NA']) regions.push(await globalping.check(component, region));
  }
  let status = classify(primary, retry, regions);
  if (before?.activeIncident && primary.status === 'ok' && retry?.status === 'ok' && regions.length === 2 && regions.every(r => r.status === 'ok')) status = 'operational';
  result.push({ ...component, ...transition(before, { status, primary, retry, regions }, at) });
}
const github = new GitHub(repository, process.env.GITHUB_TOKEN);
const incidents = await github.sync(result, at);
const data = { schemaVersion: 1, generatedAt: new Date().toISOString(), repository: `https://github.com/${repository}`, components: result, incidents };
await mkdir('site/data', { recursive: true });
await writeFile('site/data/status.json', JSON.stringify(data, null, 2) + '\n');
// Registro append-only de rondas: conserva también incidencias entre publicaciones.
await mkdir('history', { recursive: true });
for (const c of result) {
  await writeFile(`history/${c.id}.yml`, `url: ${c.url}\nstatus: ${c.status === 'operational' ? 'up' : 'down'}\ncode: ${c.primary.code || 0}\nresponseTime: ${c.primary.ms || 0}\nlastUpdated: ${at}\nstartTime: ${c.firstCheckedAt || at}\ngenerator: SlateDsk (Upptime fork)\n`);
}
await writeFile('history/rounds.ndjson', JSON.stringify({ at, components: result }) + '\n', { flag: 'a' });
const readme = await readFile('README.md', 'utf8');
const summary = `<!-- live:start -->\nÚltima ronda: **${at}**. Tras 15 minutos este resumen debe considerarse **sin verificar**.\n\n| Componente | Último resultado |\n|---|---|\n${result.map(c => `| ${c.name} | ${labels[c.status]} |`).join('\n')}\n\n[Incidencias y actualizaciones](https://github.com/${repository}/issues) · [Datos con fechas y regiones](site/data/status.json)\n<!-- live:end -->`;
await writeFile('README.md', readme.replace(/<!-- live:start -->[\s\S]*?<!-- live:end -->/, summary));
