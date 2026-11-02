import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHistory } from '../src/history.mjs';
const at = '2026-11-02T10:00:00Z';
const round = (at,status='operational') => ({at,components:[{id:'api',status,primary:{ms:12}}]});
test('el historial vacío no inventa registros ni disponibilidad',()=>{
  assert.deepEqual(makeHistory('',null).api,[]);
});
test('mantiene verificaciones incompletas y solo campos públicos previstos',()=>{
  const source=round(at,'incomplete');source.components[0].privateField='not for publication';
  const result=makeHistory(JSON.stringify(source),null);
  assert.deepEqual(result.api,[{at:'2026-11-02T10:00:00.000Z',status:'incomplete',ms:12}]);
});
test('ordena, deduplica y limita a 60 observaciones reales',()=>{
  const rows=Array.from({length:80},(_,i)=>round(new Date(Date.parse(at)+i*60_000).toISOString()));
  const result=makeHistory(rows.reverse().map(JSON.stringify).join('\n'),round(at,'outage'));
  assert.equal(result.api.length,60);assert.equal(result.api[0].at,'2026-11-02T10:20:00.000Z');
  const same=makeHistory(JSON.stringify(round(at)),round(at,'outage'));
  assert.equal(same.api.length,1);assert.equal(same.api[0].status,'outage');
});
test('ignora filas inválidas, componentes ajenos y fechas futuras',()=>{
  const bad=[round('invalid'),round('2099-01-01'),{at,components:[{id:'private',status:'operational'},{id:'api',status:'made-up'}]}];
  const result=makeHistory('bad json\n'+bad.map(JSON.stringify).join('\n'),null);
  assert.deepEqual(result.api,[]);assert.equal(Object.hasOwn(result,'private'),false);
});
