import { execFileSync } from 'node:child_process';
import { readFile, lstat } from 'node:fs/promises';
const names = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const allowed = new Set(['LICENSE', 'README.md', 'package.json', '.gitignore', '.gitattributes', '.upptimerc.yml']);
const patterns = {
  'github-token': /gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}/g,
  'private-key': /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  'provider-key': /(?:sk_live_|rk_live_|sk_test_|re_)[A-Za-z0-9]{20,}/g,
  'database-credential': /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/g,
  'oauth-secret': /"client_secret"\s*:\s*"[^"$]+"/g,
  'jwt': /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g,
};
const findings = []; let count = 0;
for (const name of names) {
  let stat; try { stat = await lstat(name); } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
  if (stat.isSymbolicLink() || !stat.isFile()) { findings.push({file:name,rule:'unexpected-file-type'}); continue; }
  count++;
  if (!allowed.has(name) && !/^(?:\.github|docs|site|src|tests|history)\//.test(name)) findings.push({file:name,rule:'unexpected-path'});
  if (/(?:^|\/)\.env|client_secret_|\.(?:pem|p12|pfx|sqlite|dump|psd)$/i.test(name)) findings.push({file:name,rule:'sensitive-file'});
  const content = await readFile(name, 'utf8');
  for (const [rule, pattern] of Object.entries(patterns)) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) findings.push({file:name,line:content.slice(0,match.index).split('\n').length,rule});
  }
}
// Se informa de ruta y regla, nunca del valor sospechoso.
console.log(JSON.stringify({files:count,findings},null,2));
if (findings.length) process.exitCode = 1;
