// The Continental v0.3E1. Dependency-free, read-only CDP screenshot helper.
// Wait for the verified Dossier identity AND its complete Evidence Match and
// Human Review workspaces to render. On transient read-only API failures, retry
// only approved read-only UI actions and preserve useful local diagnostics.
// This helper accesses only a loopback Next.js page, never user browser profiles.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyReadiness, nextReadOnlyRecovery, buildReadinessExpression, buildRecoveryClickExpression } from './Capture-ContinentalV03Readiness.mjs';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || index + 1 >= process.argv.length) throw Error(`Missing --${name}`);
  return process.argv[index + 1];
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
const browserPath = arg('browser');
const url = new URL(arg('url'));
const jobTitle = arg('title');
const company = arg('company');
const outputPath = path.resolve(arg('output'));
const browserLogPath = path.resolve(arg('log'));
const timeoutMs = 75000;
if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.port !== '3000' ||
    !/^\/dossier\/[0-9a-f-]{36}$/.test(url.pathname) || url.username || url.password || url.search || url.hash) {
  throw Error('Refusing non-local or unexpected Dossier URL');
}
if (jobTitle.trim().length < 5 || company.trim().length < 5) throw Error('Expected title/company missing');
if (!fs.existsSync(browserPath)) throw Error('Selected browser executable does not exist');

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    ws.addEventListener('message', evt => {
      let data;
      try { data = JSON.parse(evt.data); } catch { return; }
      if (typeof data.id !== 'number') return;
      const p = this.pending.get(data.id);
      if (!p) return;
      this.pending.delete(data.id);
      clearTimeout(p.timer);
      if (data.error) p.reject(Error(`${p.method}: ${data.error.message}`));
      else p.resolve(data.result);
    });
    ws.addEventListener('close', () => {
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(Error('DevTools connection closed')); }
      this.pending.clear();
    });
  }
  send(method, params = {}, wait = 8000) {
    if (this.ws.readyState !== WebSocket.OPEN) return Promise.reject(Error('DevTools connection not open'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error(`${method} timed out`)); }, wait);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}
async function connectWebSocket(wsUrl) {
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { ws.close(); reject(Error('DevTools WebSocket timeout')); }, 6000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(ws); });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(Error('DevTools WebSocket error')); });
  });
}
async function ensureReady(cdp) {
  const expression = buildReadinessExpression(jobTitle, company);
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, 9000);
  if (result.exceptionDetails || !result.result?.value) throw Error('Browser could not evaluate Dossier readiness');
  const state = result.result.value;
  return { ...classifyReadiness(state, url.pathname), state };
}

async function clickApprovedReadOnlyAction(cdp, action) {
  // Only two exact GET-only buttons are permitted.
  const expression = buildRecoveryClickExpression(action);
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, 9000);
  return result?.result?.value === true;
}

function verifyPng(bytes) {
  if (bytes.length < 10000 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw Error('Invalid or unexpectedly small PNG');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width < 1300 || height < 700 || width > 6000 || height > 25000) {
    throw Error(`Unexpected PNG resolution ${width}x${height}`);
  }
  return { width, height };
}
let browser;
let ws;
let profile;
let captured = false;
let stderr = '';
let failureReason = '';
let lastState = null;
const recoveries = { match: 0, reviews: 0 };
const events = [];
let lastRecoveryAt = 0;
try {
  profile = await mkdtemp(path.join(os.tmpdir(), 'continental-v03e1-cdp-'));
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--disable-background-networking', '--disable-component-update',
    '--disable-extensions', '--disable-sync', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, '--window-size=1500,1100', 'about:blank'
  ];
  browser = spawn(browserPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  browser.stdout.on('data', () => {});
  browser.stderr.on('data', chunk => {
    stderr += chunk.toString('utf8');
    if (stderr.length > 50000) stderr = stderr.slice(-50000);
  });
  browser.on('error', e => { stderr += `\nBrowser process error: ${e.message}`; });

  // Chrome/Edge writes a dynamically allocated local CDP port here.
  const deadline = Date.now() + timeoutMs;
  let port;
  while (Date.now() < deadline) {
    try {
      const data = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/);
      const n = Number(data[0]);
      if (n > 0 && n <= 65535) { port = n; break; }
    } catch { /* browser still starting */ }
    if (browser.exitCode !== null) throw Error(`Browser exited before DevTools startup: ${browser.exitCode}`);
    await sleep(180);
  }
  if (!port) throw Error('Browser did not expose the isolated debugging port');
  let pages = [];
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) pages = await response.json();
      if (pages.some(p => p.type === 'page' && p.webSocketDebuggerUrl)) break;
    } catch { /* local CDP startup */ }
    await sleep(180);
  }
  const page = pages.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
  if (!page) throw Error('No DevTools page target available');
  ws = await connectWebSocket(page.webSocketDebuggerUrl);
  const cdp = new Cdp(ws);
  // Record only loopback API response status/path for debugging; never body data.
  ws.addEventListener('message', event => {
    try {
      const message = JSON.parse(event.data);
      if (message.method !== 'Network.responseReceived') return;
      const response = message.params?.response;
      const u = new URL(response.url);
      if (u.hostname === '127.0.0.1' && u.port === '8000' && u.pathname.startsWith('/opportunities/')) {
        events.push({ path: u.pathname, status: response.status });
        if (events.length > 40) events.shift();
      }
    } catch { /* ignore unrelated browser events */ }
  });
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1100, deviceScaleFactor: 1, mobile: false });
  const navigation = await cdp.send('Page.navigate', { url: url.href });
  if (navigation.errorText) throw Error(`Page navigation failed: ${navigation.errorText}`);
  let fullyReady = false;
  while (Date.now() < deadline) {
    const result = await ensureReady(cdp);
    lastState = result.state;
    if (result.ready) {
      // Stability check: both independently fetched workspaces must stay ready.
      await sleep(950);
      const stable = await ensureReady(cdp);
      lastState = stable.state;
      if (stable.ready) { fullyReady = true; break; }
    }
    // The UI has explicit GET-only recovery controls. Limit each action to two
    // attempts and wait for its React loading state to settle before retrying.
    const action = nextReadOnlyRecovery(lastState, recoveries);
    if (action && Date.now() - lastRecoveryAt >= 1800) {
      const used = await clickApprovedReadOnlyAction(cdp, action);
      if (used) {
        if (action === 'retry-match') recoveries.match += 1;
        else recoveries.reviews += 1;
        lastRecoveryAt = Date.now();
        process.stdout.write(`INFO: ${action} due to explicit UI fetch error (${action === 'retry-match' ? recoveries.match : recoveries.reviews}/2).\n`);
        await sleep(1400);
        continue;
      }
    }
    // Once explicit errors have exhausted their retries, do not pretend that
    // more waiting will fix a terminal React error state.
    if (lastState.matchError && recoveries.match >= 2 && !lastState.matchLoading && Date.now() - lastRecoveryAt > 2500) break;
    if (lastState.reviewError && recoveries.reviews >= 2 && !lastState.reviewLoading && Date.now() - lastRecoveryAt > 2500) break;
    await sleep(300);
  }
  if (!fullyReady) {
    const result = lastState ? classifyReadiness(lastState, url.pathname) : { reason: 'no-page-state' };
    throw Error(`Full Dossier not ready (${result.reason}). matchError=${Boolean(lastState?.matchError)}, reviewError=${Boolean(lastState?.reviewError)}, matchSummary=${Boolean(lastState?.matchSummary)}, requirementNavigator=${Boolean(lastState?.requirementNavigator)}, reviewReady=${Boolean(lastState?.reviewReady)}, matchRetries=${recoveries.match}, reviewRetries=${recoveries.reviews}. See private browser diagnostic log.`);
  }
  // Full-page capture preserves requirement lists and the review workspace.
  const metrics = await cdp.send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize || metrics.contentSize || {};
  const height = Math.max(1100, Math.min(22000, Math.ceil(size.height || 1100)));
  const width = Math.max(1500, Math.min(3000, Math.ceil(size.width || 1500)));
  const image = await cdp.send('Page.captureScreenshot', {
    format: 'png', fromSurface: true, captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 }
  }, 12000);
  if (!image?.data) throw Error('CDP did not return screenshot data');
  const png = Buffer.from(image.data, 'base64');
  const dims = verifyPng(png);
  await writeFile(outputPath, png, { flag: 'wx' });
  captured = true;
  process.stdout.write(`PASS: hydrated Dossier captured: ${jobTitle} / ${company} (${dims.width}x${dims.height}; ${png.length} bytes)\n`);
} catch (error) {
  failureReason = error.message;
  process.stdout.write(`FAIL: ${error.message}\n`);
  process.exitCode = 1;
 } finally {
  // On failure, retain a private debug screenshot, clearly separated from the
  // required output PNG and NEVER eligible for the README screenshot gallery.
  if (!captured && ws?.readyState === WebSocket.OPEN && lastState?.title && lastState?.company) {
    try {
      const debugCdp = new Cdp(ws);
      const debug = await debugCdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, 5000);
      if (debug?.data) {
        const debugPath = browserLogPath.replace(/\.txt$/i, '-FAILED-DO-NOT-PUBLISH.png');
        await writeFile(debugPath, Buffer.from(debug.data, 'base64'), { flag: 'wx' });
        process.stdout.write(`INFO: Private failed-state screenshot: ${debugPath}\n`);
      }
    } catch { /* logs will still be written */ }
  }
  try { if (ws) ws.close(); } catch { }
  if (browser && browser.exitCode === null) { try { browser.kill(); } catch { } }
  if (browser?.stdout) { try { browser.stdout.destroy(); } catch { } }
  if (browser?.stderr) { try { browser.stderr.destroy(); } catch { } }
  try {
    const report = [
      `Capture result: ${captured ? 'PASS' : 'FAIL'}`,
      `Failure reason: ${failureReason || 'none'}`,
      `UI state: ${JSON.stringify(lastState, null, 2)}`,
      `Read-only recovery attempts: ${JSON.stringify(recoveries)}`,
      `Loopback API response status history: ${JSON.stringify(events, null, 2)}`,
      '--- BROWSER STDERR (tail) ---', stderr.slice(-15000)
    ].join('\n');
    await writeFile(browserLogPath, report, 'utf8');
  } catch { }
  if (profile) { try { await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }); } catch { } }
  if (!captured) { try { await rm(outputPath, { force: true }); } catch { } }
}
