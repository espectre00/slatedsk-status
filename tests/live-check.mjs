// Solo lecturas públicas. No abre Issues ni altera datos publicados.
import { components } from '../src/config.mjs';
import { check } from '../src/check.mjs';
for (const c of components) console.log(JSON.stringify({ at: new Date().toISOString(), component: c.id, ...await check(c) }));
