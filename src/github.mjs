import { labels } from './config.mjs';
export class GitHub {
  constructor(repo, token, fetcher = fetch) { this.repo = repo; this.token = token; this.fetcher = fetcher; this.permissions = new Map(); this.recentIssues = new Map(); }
  async api(path, method = 'GET', body) {
    const response = await this.fetcher(`https://api.github.com/repos/${this.repo}/${path}`, { method, signal: AbortSignal.timeout(20_000), headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'Cache-Control': 'no-cache', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) throw new Error(`GitHub ${response.status}: ${path.split('?')[0]}`);
    return response.status === 204 ? null : response.json();
  }
  async all(path) {
    const out = [];
    for (let page = 1; ; page++) {
      const rows = await this.api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      out.push(...rows);
      if (rows.length < 100) return out;
    }
  }
  async trusted(login) {
    if (!this.permissions.has(login)) {
      try { const p = await this.api(`collaborators/${encodeURIComponent(login)}/permission`); this.permissions.set(login, ['admin', 'maintain', 'write'].includes(p.permission)); }
      catch { this.permissions.set(login, false); }
    }
    return this.permissions.get(login);
  }
  async listIssues() {
    const merged = new Map((await this.all('issues?state=all')).filter(i => !i.pull_request).map(i => [i.number, i]));
    // La lista de GitHub puede tardar en reflejar una escritura ya aceptada.
    for (const [number, issue] of this.recentIssues) merged.set(number, issue);
    return [...merged.values()];
  }
  async sync(components, at) {
    const issues = await this.listIssues();
    for (const component of components) {
      const marker = `<!-- slatedsk-monitor:${component.id} -->`;
      const matching = issues.filter(i => i.user.login === 'github-actions[bot]' && i.body?.includes(marker));
      const opened = matching.filter(i => i.state === 'open');
      if (opened.length > 1) throw new Error(`Duplicate incidents: ${component.id}`);
      let issue = opened[0];
      // Issues sirven de diario si se creó el aviso pero falló el commit anterior.
      if (!component.activeIncident && issue) {
        component.activeIncident = true;
        // Un aviso desconocido por el snapshot indica publicación anterior fallida.
        // No reutilizar una racha verde anterior a la apertura.
        component.goodRounds = component.recovering === false && component.regions?.length === 2 ? component.goodRounds : 0;
        if (component.goodRounds < 2) component.status = 'partial';
      }
      const evidence = JSON.stringify({ checkedAt: at, primary: component.primary, retry: component.retry, regions: component.regions });
      const body = `${marker}\n${labels[component.status]}\n\nLast checked: ${at}.\n\nCause not yet confirmed. These checks do not validate sign-in, billing or every operation.\n\nPublic evidence:\n\n\`\`\`json\n${evidence}\n\`\`\``;
      if (component.activeIncident && !issue) {
        issue = await this.api('issues', 'POST', { title: `${component.name}: ${labels[component.status]}`, body });
        this.recentIssues.set(issue.number, issue);
        issues.push(issue);
      } else if (issue && component.goodRounds >= 2) {
        await this.api(`issues/${issue.number}/comments`, 'POST', { body: `Recovery verified after two consecutive successful rounds. ${at}` });
        await this.api(`issues/${issue.number}`, 'PATCH', { state: 'closed', state_reason: 'completed' });
        issue.state = 'closed'; issue.closed_at = at;
        this.recentIssues.set(issue.number, issue);
        component.activeIncident = false;
        component.status = 'operational';
      } else if (issue) {
        await this.api(`issues/${issue.number}`, 'PATCH', { body });
        issue.body = body;
        this.recentIssues.set(issue.number, issue);
      }
    }
    return this.publicIncidents();
  }
  async publicIncidents() {
    const out = [];
    for (const issue of await this.listIssues()) {
      const automatic = issue.user.login === 'github-actions[bot]' && /<!-- slatedsk-monitor:(web|app|api|data) -->/.test(issue.body || '');
      const manual = issue.labels.some(l => l.name === 'status-published') && await this.trusted(issue.user.login);
      if (!automatic && !manual) continue;
      const comments = await this.all(`issues/${issue.number}/comments`);
      const updates = [];
      for (const c of comments) if (c.user.login === 'github-actions[bot]' || await this.trusted(c.user.login)) updates.push({ at: c.created_at, text: c.body.slice(0, 6000) });
      out.push({ number: issue.number, title: issue.title, body: issue.body?.slice(0, 12000), url: issue.html_url, state: issue.state, createdAt: issue.created_at, closedAt: issue.closed_at, maintenance: manual && issue.labels.some(l => l.name === 'maintenance'), manual, updates });
    }
    return out.sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}
