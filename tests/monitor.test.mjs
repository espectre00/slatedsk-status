import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, transition, fresh } from '../src/engine.mjs';
import { check, assess, scriptUrl } from '../src/check.mjs';
import { Globalping } from '../src/globalping.mjs';
import { components } from '../src/config.mjs';
const point = status => ({ status });
const regions = (eu, na) => [{ region: 'EU', status: eu }, { region: 'NA', status: na }];
const at = '2026-11-02T12:00:00Z';
test('confirmación, discrepancia, lentitud, fallo aislado y sondas ausentes', () => {
  assert.equal(classify(point('fail'),point('fail'),regions('fail','fail')), 'outage');
  assert.equal(classify(point('fail'),point('fail'),regions('ok','fail')), 'partial');
  assert.equal(classify(point('slow'),point('slow'),regions('slow','ok')), 'degraded');
  assert.equal(classify(point('fail'),point('ok'),regions('ok','ok')), 'observation');
  assert.equal(classify(point('fail'),point('fail'),regions('unknown','fail')), 'incomplete');
  assert.equal(classify(point('fail'),point('fail'),[]), 'incomplete');
  assert.equal(classify(point('ok'),null,[]), 'operational');
  assert.equal(classify(point('ok'),point('ok'),regions('ok','ok')), 'operational');
});
test('recuperación requiere dos rondas contiguas y reinicia tras fallo o datos antiguos', () => {
  const down = transition({}, {status:'outage'}, at);
  const one = transition(down, {status:'operational'}, '2026-11-02T12:05:00Z');
  assert.equal(one.status,'outage'); assert.equal(one.activeIncident,true);
  const two = transition(one, {status:'operational'}, '2026-11-02T12:10:00Z');
  assert.equal(two.status,'operational'); assert.equal(two.activeIncident,false);
  assert.equal(transition(one,{status:'incomplete'},'2026-11-02T12:10:00Z').goodRounds,0);
  assert.equal(transition(one,{status:'operational'},'2026-11-02T12:25:00Z').goodRounds,1);
});
test('monitor detenido, publicación detenida y fechas inválidas nunca son frescos', () => {
  assert.equal(fresh(at,Date.parse('2026-11-02T12:16:00Z')),false);
  assert.equal(fresh(null),false); assert.equal(fresh('invalid'),false);
  assert.equal(fresh('2099-01-01'),false);
  const old = transition({}, {status:'operational'},at);
  const incomplete = transition(old, {status:'incomplete'},'2026-11-02T12:05:00Z');
  assert.equal(incomplete.lastValidAt,at); assert.deepEqual(incomplete.lastResult,old.lastResult);
});
test('HTTP, contenido, cache, JSON y contrato de disponibilidad', () => {
  const c = components[3];
  const raw = {code:200,ms:50,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({ok:true,status:'ready',checks:{database:'ok'}})};
  assert.equal(assess(c,raw).status,'ok');
  for (const change of [{code:503},{body:'not json'},{body:'{"ok":true,"status":"ready"}'}]) assert.equal(assess(c,{...raw,...change}).status,'fail');
  for (const headers of [{'content-type':'application/json'},{...raw.headers,age:'10'}]) assert.equal(assess(c,{...raw,headers}).status,'unknown');
  assert.equal(assess(c,{...raw,ms:5001}).status,'slow');
});
test('DNS, TLS y timeout se registran sin exponer mensajes', async () => {
  for (const code of ['ENOTFOUND','CERT_HAS_EXPIRED','ETIMEDOUT']) {
    const r = await check(components[0],async()=>{throw Object.assign(new Error('private detail'),{cause:{code}});});
    assert.equal(r.status,'fail'); assert.equal(r.reason,code); assert.ok(!JSON.stringify(r).includes('private detail'));
  }
});
const html = '<title>SlateDsk</title><div id="root"></div><script src="/assets/main.js" type="module"></script>';
test('comprueba el JavaScript principal y rechaza HTML de fallback', async () => {
  assert.equal(scriptUrl(html,components[1].url),'https://app.slatedsk.com/assets/main.js');
  const mock = async url => String(url).includes('.js') ? new Response('<html>fallback</html>',{headers:{'content-type':'text/html'}}) : new Response(html,{headers:{'content-type':'text/html'}});
  assert.equal((await check(components[1],mock)).status,'fail');
  assert.equal(assess(components[1],{code:200,ms:1,body:'<title>SlateDsk',headers:{'content-type':'text/html'},truncated:true}).status,'unknown');
});
test('cuota gratuita agotada no ejecuta POST ni declara caída', async () => {
  let posts=0;
  const mock=async(url,options)=>{if(options.method==='POST')posts++;return Response.json({rateLimit:{measurements:{create:{remaining:0}}}});};
  const gp=new Globalping('test',mock,async()=>{});
  assert.equal((await gp.check(components[0],'EU')).status,'unknown'); assert.equal(posts,0);
  assert.equal((await new Globalping(null,mock).check(components[0],'NA')).status,'unknown');
});
test('región y TLS se validan con respuestas reales del contrato Globalping', async () => {
  const mock=async(url,options)=>{
    if(url.endsWith('/limits'))return Response.json({rateLimit:{measurements:{create:{remaining:200}}}});
    if(options.method==='POST') {const body=JSON.parse(options.body);assert.deepEqual(body.locations,[{continent:'EU',limit:1}]);return Response.json({id:'test'});}
    return Response.json({status:'finished',results:[{probe:{continent:'EU',country:'ES',city:'Madrid'},result:{status:'finished',tls:{authorized:false},statusCode:200,rawBody:html,headers:{'content-type':'text/html'},timings:{total:20}}}]});
  };
  const gp=new Globalping('test',mock,async()=>{});
  assert.equal((await gp.check(components[0],'EU')).reason,'tls');
});
