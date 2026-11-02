export function scriptUrl(body, base) {
  for (const tag of body.match(/<script\b[^>]*>/gi) || []) {
    if (!/type\s*=\s*["']module["']/i.test(tag)) continue;
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const url = new URL(src, base);
    if (url.origin === new URL(base).origin && /\.m?js$/.test(url.pathname)) return url.href;
  }
  return null;
}
export function validate(component, { code, body = '', headers = {}, truncated }) {
  if (code !== 200) return 'http';
  if (component.kind === 'asset') return /(?:javascript|ecmascript)/i.test(headers['content-type'] || '') && body.length > 0 ? null : 'javascript';
  if (component.kind === 'html' || component.kind === 'app') {
    if (!/text\/html/i.test(headers['content-type'] || '') || !/<title>[^<]*SlateDsk/i.test(body) || !/id=["']root["']/.test(body)) return truncated ? 'incomplete-content' : 'content';
    if (component.kind === 'app' && !scriptUrl(body, component.url)) return truncated ? 'incomplete-content' : 'javascript';
    return null;
  }
  if (!/application\/json/i.test(headers['content-type'] || '')) return 'content';
  if (!/\bno-store\b/i.test(headers['cache-control'] || '') || Number(headers.age || 0) > 0) return 'cache';
  try { const json = JSON.parse(body); return json.ok === true && json.status === (component.kind === 'ready' ? 'ready' : 'ok') && (component.kind !== 'ready' || json.checks?.database === 'ok') ? null : 'content'; } catch { return 'content'; }
}
export function assess(component, raw) {
  const reason = validate(component, raw);
  return { status: ['incomplete-content', 'cache'].includes(reason) ? 'unknown' : reason ? 'fail' : raw.ms > 5000 ? 'slow' : 'ok', reason, code: raw.code, ms: Math.round(raw.ms) };
}
export async function readUrl(url, fetcher = fetch) {
  const start = performance.now();
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(12_000), headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' } });
  const body = await response.text();
  if (body.length > 4_000_000) throw new Error('response-too-large');
  return { code: response.status, body, headers: Object.fromEntries(response.headers), ms: performance.now() - start };
}
export async function check(component, fetcher = fetch) {
  try {
    const url = new URL(component.url);
    if (['health', 'ready'].includes(component.kind)) url.searchParams.set('_status', Date.now());
    const raw = await readUrl(url, fetcher);
    const result = assess(component, raw);
    if (component.kind === 'app' && ['ok', 'slow'].includes(result.status)) {
      const asset = await readUrl(scriptUrl(raw.body, component.url), fetcher);
      const assetResult = assess({ kind: 'asset' }, asset);
      return { ...assetResult, ms: Math.round(raw.ms + asset.ms), status: assetResult.status === 'ok' && raw.ms + asset.ms > 5000 ? 'slow' : assetResult.status };
    }
    return result;
  } catch (error) { return { status: 'fail', reason: error.cause?.code || error.name || 'network', code: null, ms: null }; }
}
