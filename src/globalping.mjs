import { assess, scriptUrl } from './check.mjs';
const api = 'https://api.globalping.io/v1/measurements';
export class Globalping {
  constructor(token, fetcher = fetch, pause = ms => new Promise(r => setTimeout(r, ms))) { this.token = token; this.fetcher = fetcher; this.pause = pause; this.used = 0; this.blocked = false; }
  async request(url, options = {}) {
    const response = await this.fetcher(url, { ...options, signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json', ...options.headers } });
    if (!response.ok) { this.blocked = true; throw new Error(`globalping-http-${response.status}`); }
    if (response.headers.has('x-ratelimit-remaining') && Number(response.headers.get('x-ratelimit-remaining')) < 4) this.blocked = true;
    return response.json();
  }
  async measure(component, region, url = component.url) {
    if (!this.token || this.blocked || this.used >= 12) throw new Error('globalping-budget');
    const limits = await this.request('https://api.globalping.io/v1/limits');
    const remaining = limits.rateLimit?.measurements?.create?.remaining;
    // Nunca recurrir a créditos. Reservar margen frente a otros usos de la cuenta.
    if (!Number.isFinite(remaining) || remaining < 20) throw new Error('globalping-free-quota');
    this.used++;
    const target = new URL(url);
    if (['health', 'ready'].includes(component.kind)) target.searchParams.set('_status', Date.now());
    const created = await this.request(api, { method: 'POST', body: JSON.stringify({ type: 'http', target: target.hostname, locations: [{ continent: region, limit: 1 }], measurementOptions: { protocol: 'HTTPS', request: { method: 'GET', path: target.pathname, ...(target.search ? { query: target.search.slice(1) } : {}), headers: { 'Cache-Control': 'no-cache, no-store' } } } }) });
    const deadline = Date.now() + 45_000;
    for (let i = 0; i < 15 && Date.now() < deadline; i++) {
      await this.pause(1000);
      const result = await this.request(`${api}/${encodeURIComponent(created.id)}`);
      if (result.status !== 'finished') continue;
      const item = result.results?.find(x => x.probe?.continent === region);
      if (!item || item.result.status === 'offline') throw new Error('probe-unavailable');
      const r = item.result;
      const location = { region, country: item.probe.country, city: item.probe.city, measurementId: created.id };
      if (r.status !== 'finished') {
        if (r.failureSource !== 'target') throw new Error('probe-unavailable');
        return { ...location, status: 'fail', reason: 'network' };
      }
      if (!r.tls || r.tls.authorized !== true) return { ...location, status: 'fail', reason: 'tls' };
      return { ...location, ...assess(component, { code: r.statusCode, body: r.rawBody, headers: r.headers, ms: r.timings.total, truncated: r.truncated }), assetUrl: component.kind === 'app' ? scriptUrl(r.rawBody || '', url) : null };
    }
    throw new Error('probe-timeout');
  }
  async check(component, region) {
    try {
      const result = await this.measure(component, region);
      if (component.kind === 'app' && ['ok', 'slow'].includes(result.status)) {
        const asset = await this.measure({ kind: 'asset' }, region, result.assetUrl);
        return { ...result, assetUrl: undefined, assetMeasurementId: asset.measurementId, status: asset.status === 'ok' && result.ms + asset.ms > 5000 ? 'slow' : asset.status, ms: result.ms + (asset.ms || 0), reason: asset.reason };
      }
      return { ...result, assetUrl: undefined };
    } catch (error) {
      const reason = /^(?:globalping-http-\d{3}|globalping-budget|globalping-free-quota|probe-unavailable|probe-timeout)$/.test(error.message) ? error.message : 'verification-unavailable';
      return { region, status: 'unknown', reason };
    }
  }
}
