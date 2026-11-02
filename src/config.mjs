export const repository = (typeof process !== 'undefined' && process.env.GITHUB_REPOSITORY) || 'espectre00/slatedsk-status';
export const components = [
  { id: 'web', name: 'Public website', url: 'https://slatedsk.com', kind: 'html', scope: 'HTTPS response and expected website content.' },
  { id: 'app', name: 'Application access', url: 'https://app.slatedsk.com', kind: 'app', scope: 'HTML and main JavaScript are accessible. Sign-in is not tested.' },
  { id: 'api', name: 'API', url: 'https://api.slatedsk.com/health', kind: 'health', scope: 'The server returns the expected health response.' },
  { id: 'data', name: 'Database connection', url: 'https://api.slatedsk.com/ready', kind: 'ready', scope: 'The server can query its database.' },
];
export const labels = { operational: 'Operational', observation: 'Under observation', outage: 'Outage confirmed at tested locations', partial: 'Possible partial outage', degraded: 'Degraded performance', incomplete: 'Verification incomplete', unverified: 'Unverified' };
