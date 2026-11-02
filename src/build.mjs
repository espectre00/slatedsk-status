import { cp, mkdir, readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile('site/data/status.json', 'utf8'));
if (data.schemaVersion !== 1 || data.components.length !== 4) throw new Error('Datos de estado inválidos');
await mkdir('dist', { recursive: true });
await cp('site', 'dist', { recursive: true });
await cp('src/engine.mjs', 'dist/engine.mjs');
await cp('src/config.mjs', 'dist/config.mjs');
console.log('Página estática preparada en dist/');
