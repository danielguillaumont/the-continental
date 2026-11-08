// v0.3E2A: private, metadata-only diagnostics for the loopback Dossier read requests.
// No request or response bodies, headers, cookies, tokens, or full URLs are retained.
const ID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const API_PATH = new RegExp(`^/opportunities/${ID_PATTERN}/(evidence-match-preview|evidence-review-options|evidence-reviews)$`, 'i');

export function safeDossierApiPath(candidate) {
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' || url.port !== '8000' ||
        !['127.0.0.1', 'localhost'].includes(url.hostname) ||
        url.username || url.password || url.search || url.hash ||
        !API_PATH.test(url.pathname)) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

function safeNetworkError(text) {
  if (typeof text !== 'string') return 'unknown';
  // Chromium network error codes are useful and do not include user-supplied data.
  const code = text.match(/net::ERR_[A-Z0-9_]+/);
  return code ? code[0] : 'other';
}

function safeToken(text) {
  return typeof text === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,100}$/.test(text) ? text : null;
}

/** Collect bounded network *metadata* from Chrome DevTools Protocol events. */
export function createBrowserApiTrace(maxEvents = 120) {
  if (!Number.isSafeInteger(maxEvents) || maxEvents < 1 || maxEvents > 500) {
    throw Error('Invalid trace limit');
  }
  const active = new Map();
  const events = [];
  let serial = 0;
  function record(item) {
    events.push({ n: ++serial, ...item });
    if (events.length > maxEvents) events.shift();
  }
  function observe(message) {
    const kind = message?.method;
    const params = message?.params;
    const id = params?.requestId;
    if (typeof id !== 'string') return;
    if (kind === 'Network.requestWillBeSent') {
      const path = safeDossierApiPath(params.request?.url);
      if (path && params.request?.method === 'GET') {
        active.set(id, path);
        record({ event: 'request', path });
      }
      return;
    }
    if (kind === 'Network.responseReceived') {
      const path = active.get(id);
      if (!path) return;
      active.set(id, path);
      const status = Number(params.response?.status);
      record({ event: 'response', path, status: Number.isInteger(status) ? status : null });
      return;
    }
    const path = active.get(id);
    if (!path) return;
    if (kind === 'Network.loadingFailed') {
      record({ event: 'failed', path, error: safeNetworkError(params.errorText),
        canceled: params.canceled === true,
        blockedReason: safeToken(params.blockedReason),
        corsError: safeToken(params.corsErrorStatus?.corsError) });
      active.delete(id);
    } else if (kind === 'Network.loadingFinished') {
      record({ event: 'finished', path });
      active.delete(id);
    }
  }
  function snapshot() {
    const failures = events.filter(e => e.event === 'failed').length;
    const badResponses = events.filter(e => e.event === 'response' && e.status !== 200).length;
    return { totalEvents: serial, retainedEvents: events.length, failedRequests: failures,
      non200Responses: badResponses, events: events.map(e => ({ ...e })) };
  }
  return { observe, snapshot };
}
