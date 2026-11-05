import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRun, decideRun, MIN_ROUND_MS } from '../src/monitor-gate.mjs';
import { components } from '../src/config.mjs';
const now = Date.parse('2026-11-05T18:00:00Z');
const snapshot = (age = 30_000) => ({ schemaVersion: 1, generatedAt: new Date(now - age).toISOString(),
  components: components.map(c => ({ id: c.id, status: 'operational', checkedAt: new Date(now - age).toISOString() })) });

test('dos relojes no repiten una ronda ya publicada, pero el siguiente intervalo sí comprueba', () => {
  const data = snapshot();
  assert.equal(shouldRun('schedule', '', data, structuredClone(data), now), false);
  assert.equal(shouldRun('workflow_dispatch', 'true', data, structuredClone(data), now), false);
  const old = snapshot(MIN_ROUND_MS);
  assert.equal(shouldRun('schedule', '', old, old, now), true);
});

test('un fallo de publicación no se oculta por tener un commit reciente', () => {
  const stored = snapshot();
  assert.equal(shouldRun('schedule', '', stored, snapshot(60_000), now), true);
  assert.equal(shouldRun('schedule', '', stored, undefined, now), true);
  const different = structuredClone(stored);
  different.components[0].status = 'outage';
  assert.equal(shouldRun('schedule', '', stored, different, now), true);
});

test('avisos manuales, cambios y recuperación forzada no esperan al siguiente intervalo', () => {
  const data = snapshot();
  for (const event of ['push', 'issues', 'issue_comment', 'workflow_dispatch']) {
    assert.equal(shouldRun(event, '', data, data, now), true);
  }
  assert.equal(shouldRun('workflow_dispatch', 'false', data, data, now), true);
});

test('fechas futuras, componentes ausentes o inválidos nunca permiten omitir comprobaciones', () => {
  const valid = snapshot();
  for (const broken of [snapshot(-60_000), { ...valid, components: [] }, { ...valid, schemaVersion: 99 },
    { ...valid, components: [...valid.components.slice(1), valid.components[1]] },
    { ...valid, generatedAt: 'bad' }]) {
    assert.equal(shouldRun('schedule', '', broken, broken, now), true);
  }
  const oldCheck = structuredClone(valid);
  oldCheck.components[0].checkedAt = snapshot(MIN_ROUND_MS).generatedAt;
  assert.equal(shouldRun('schedule', '', oldCheck, oldCheck, now), true);
});

test('errores al leer datos publicados o el archivo local obligan a ejecutar el monitor', async () => {
  const data = snapshot();
  const read = async () => JSON.stringify(data);
  for (const fetcher of [async () => { throw new Error('network'); },
    async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('json'); } })]) {
    assert.equal(await decideRun({ event: 'schedule', now, read, fetcher }), true);
  }
  assert.equal(await decideRun({ event: 'schedule', now, read: async () => { throw new Error('missing'); } }), true);
  assert.equal(await decideRun({ event: 'schedule', now, read, fetcher: async () => ({ ok: true, json: async () => data }) }), false);
});
