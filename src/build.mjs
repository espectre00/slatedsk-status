import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const data = JSON.parse(await readFile('site/data/status.json', 'utf8'));
if (data.schemaVersion !== 1 || data.components.length !== 4) throw new Error('Datos de estado inválidos');
await mkdir('dist', { recursive: true });
await cp('site', 'dist', { recursive: true });
await cp('src/engine.mjs', 'dist/engine.mjs');
await cp('src/config.mjs', 'dist/config.mjs');
// Cada dependencia cambia de URL cuando cambia su contenido, incluso si el
// navegador conserva una versión anterior de config o de los estilos.
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
let app = await readFile('site/app.mjs', 'utf8');
for (const name of ['config', 'engine']) {
  const content = await readFile(`dist/${name}.mjs`, 'utf8');
  app = app.replace(`'./${name}.mjs'`, `'./${name}.mjs?v=${digest(content)}'`);
}
await writeFile('dist/app.mjs', app);
const css = await readFile('dist/style.css', 'utf8');
let html = await readFile('dist/index.html', 'utf8');
html = html.replace(/\.\/app\.mjs(?:\?[^"']*)?/, `./app.mjs?v=${digest(app)}`);
html = html.replace(/\.\/style\.css(?:\?[^"']*)?/, `./style.css?v=${digest(css)}`);
await writeFile('dist/index.html', html);
console.log('Página estática preparada en dist/');
