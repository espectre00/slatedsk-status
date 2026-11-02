import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHub } from '../src/github.mjs';
function fixture() {
  const issues=[],comments=new Map(); let creates=0;
  const github=new GitHub('example/status','test');
  github.api=async(path,method='GET',body)=>{
    if(path.startsWith('collaborators/'))return {permission:path.includes('owner')?'admin':'read'};
    if(path==='issues'&&method==='POST'){creates++;const issue={...body,number:creates,state:'open',user:{login:'github-actions[bot]'},labels:[],created_at:'2026-11-02',html_url:'https://github.com/example/status/issues/1'};issues.push(issue);return issue;}
    const n=Number(path.split('/')[1]),issue=issues.find(i=>i.number===n);
    if(method==='PATCH'){Object.assign(issue,body);return issue;}
    if(method==='POST'&&path.endsWith('/comments')){comments.set(n,[...(comments.get(n)||[]),{body:body.body,user:{login:'github-actions[bot]'}}]);return {};}
    throw new Error(path);
  };
  github.all=async path=>path.startsWith('issues?')?structuredClone(issues):comments.get(Number(path.split('/')[1]))||[];
  return {github,issues,comments,creates:()=>creates};
}
test('una incidencia por componente; sobrevive a fallo de commit y no elimina incidencias breves',async()=>{
  const f=fixture(); const c={id:'api',name:'API',status:'outage',activeIncident:true,goodRounds:0};
  await f.github.sync([c],'2026-11-02'); await f.github.sync([c],'2026-11-02'); assert.equal(f.creates(),1);
  const afterLostCommit={...c,status:'operational',activeIncident:false,goodRounds:1};
  await f.github.sync([afterLostCommit],'2026-11-02'); assert.equal(f.issues[0].state,'open');
  await f.github.sync([{...afterLostCommit,status:'operational',goodRounds:2,recovering:false,regions:[{region:'EU',status:'ok'},{region:'NA',status:'ok'}]}],'2026-11-02');
  assert.equal(f.issues[0].state,'closed'); assert.equal((await f.github.publicIncidents()).length,1);
  await f.github.sync([{...c}],'2026-11-03'); assert.equal(f.creates(),2);
});
test('avisos y comentarios ajenos no se publican',async()=>{
  const f=fixture();
  f.issues.push({number:1,user:{login:'stranger'},labels:[{name:'status-published'}],body:'no',created_at:'2026-11-02'});
  f.issues.push({number:2,user:{login:'owner'},labels:[{name:'status-published'},{name:'maintenance'}],body:'aviso',created_at:'2026-11-02'});
  f.comments.set(2,[{user:{login:'stranger'},body:'fake'},{user:{login:'owner'},body:'actualización'}]);
  const out=await f.github.publicIncidents();assert.equal(out.length,1);assert.equal(out[0].maintenance,true);assert.equal(out[0].updates.length,1);
});
