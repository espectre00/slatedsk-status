import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { makeHistory } from '../src/history.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root=resolve('dist');
const server=createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root))throw new Error('path');
    res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[extname(path)]||'text/plain');res.end(await readFile(path));
  } catch {res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || undefined});
await mkdir('out',{recursive:true});
const errors=[];
try {
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  const initial=JSON.parse(await readFile('site/data/status.json','utf8'));
  let fixture={...structuredClone(initial),generatedAt:null,history:{}},broken=false;
  await page.route('**/data/status.json*',async route=>broken?route.abort():route.fulfill({json:fixture}));
  const url=`http://127.0.0.1:${server.address().port}`;
  const load=async()=>{await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);};
  await load();assert.equal(await page.locator('#headline').textContent(),'Estado sin verificar');
  assert.equal(await page.locator('.history-bar[data-state]').count(),0);
  fixture.generatedAt=new Date().toISOString();fixture.components=fixture.components.map(c=>({...c,status:'operational',lastValidAt:fixture.generatedAt,checkedAt:fixture.generatedAt,lastResult:{status:'operational',at:fixture.generatedAt}}));
  fixture.history=makeHistory(await readFile('history/rounds.ndjson','utf8').catch(()=>''),{at:fixture.generatedAt,components:fixture.components});
  await load();assert.equal(await page.locator('#headline').textContent(),'Comprobaciones correctas');
  assert.equal(await page.locator('.history-bar').count(),240);
  await page.screenshot({path:'out/desktop-preview.png'});
  await page.screenshot({path:'out/desktop.png',fullPage:true});
  await page.locator('[data-component="web"] > summary').click();
  fixture.components[0].primary={...fixture.components[0].primary,ms:987};
  await Promise.all([page.waitForResponse(r=>r.url().includes('/data/status.json')),page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')))]);
  await page.getByText(/987 ms desde GitHub/).waitFor();
  assert.equal(await page.locator('[data-component="web"]').getAttribute('open'),'');
  fixture.incidents=[{number:1,title:'Mantenimiento de infraestructura',body:'Ventana prevista: 03:00–03:30 CET. <img src=x onerror=alert(1)>',createdAt:fixture.generatedAt,state:'open',manual:true,maintenance:true,updates:[]}];
  await page.setViewportSize({width:390,height:844});await load();
  assert.equal(await page.locator('#headline').textContent(),'Mantenimiento comunicado');
  await page.locator('#incidents summary').click();assert.equal(await page.locator('#incidents details img').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'out/mobile.png',fullPage:true});
  fixture.generatedAt=new Date(Date.now()-16*60_000).toISOString();await load();assert.equal(await page.locator('#headline').textContent(),'Estado sin verificar');
  assert.equal(await page.locator('#incidents details').count(),1);
  await page.screenshot({path:'out/stale.png',fullPage:true});
  fixture.incidents=[];fixture.generatedAt=new Date().toISOString();broken=true;await load();assert.equal(await page.locator('#headline').textContent(),'Estado sin verificar');
  assert.deepEqual(errors,[]);await writeFile('out/browser-result.json',JSON.stringify({passed:true,width:390,checks:['initial','fresh','maintenance','escaping','mobile-overflow','stale','publication-or-fetch-failure'],errors},null,2));
  console.log('Revisión visual correcta: escritorio, móvil, antigüedad, avisos y fallo de datos.');
} finally {await browser.close();await new Promise(r=>server.close(r));}
