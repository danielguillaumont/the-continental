import test from 'node:test';
import assert from 'node:assert/strict';
import { safeDossierApiPath, createBrowserApiTrace } from '../BrowserRequestDiagnostics.mjs';
const id = '5c5827de-cfd4-48bc-9a08-fab046b5826b';
const u = `http://127.0.0.1:8000/opportunities/${id}/evidence-match-preview`;
test('accepts only exact local read endpoints, discarding URL query and credentials', () => {
  assert.equal(safeDossierApiPath(u), `/opportunities/${id}/evidence-match-preview`);
  assert.ok(safeDossierApiPath(`http://localhost:8000/opportunities/${id}/evidence-reviews`));
  assert.equal(safeDossierApiPath(u + '?token=abc'), null);
  assert.equal(safeDossierApiPath(`http://example.com:8000/opportunities/${id}/evidence-reviews`), null);
  assert.equal(safeDossierApiPath(`http://user:pass@127.0.0.1:8000/opportunities/${id}/evidence-reviews`), null);
  assert.equal(safeDossierApiPath(`http://127.0.0.1:8000/opportunities/${id}/source`), null);
  assert.equal(safeDossierApiPath(`http://127.0.0.1:8000/opportunities/${id}/evidence-reviews/other`), null);
});
test('records successful GET lifecycle without bodies or headers', () => {
  const trace = createBrowserApiTrace();
  trace.observe({ method: 'Network.requestWillBeSent', params: { requestId: 'a', request: { url: u, method: 'GET', headers: { Authorization: 'secret' }, postData: 'secret' } } });
  trace.observe({ method: 'Network.responseReceived', params: { requestId: 'a', response: { url: u, status: 200, headers: { 'set-cookie': 'secret' } } } });
  trace.observe({ method: 'Network.loadingFinished', params: { requestId: 'a' } });
  const data = trace.snapshot();
  assert.equal(data.events.length, 3);
  assert.equal(data.failedRequests, 0);
  assert.equal(data.non200Responses, 0);
  assert.ok(!JSON.stringify(data).includes('secret'));
});
test('records safe failure codes, CORS classification and cancellation', () => {
  const trace = createBrowserApiTrace();
  trace.observe({ method: 'Network.requestWillBeSent', params: { requestId: 'b', request: { url: u, method: 'GET' } } });
  trace.observe({ method: 'Network.loadingFailed', params: { requestId: 'b', errorText: 'net::ERR_FAILED', canceled: true,
    blockedReason: 'cors', corsErrorStatus: { corsError: 'MissingAllowOriginHeader' } } });
  const data = trace.snapshot();
  assert.equal(data.failedRequests, 1);
  assert.deepEqual(data.events[1], { n: 2, event: 'failed', path: `/opportunities/${id}/evidence-match-preview`,
    error: 'net::ERR_FAILED', canceled: true, blockedReason: 'cors', corsError: 'MissingAllowOriginHeader' });
});
test('ignores unrelated and write requests', () => {
  const trace = createBrowserApiTrace();
  trace.observe({ method: 'Network.requestWillBeSent', params: { requestId: 'c', request: { url: u, method: 'PUT' } } });
  trace.observe({ method: 'Network.responseReceived', params: { requestId: 'c', response: { url: u, status: 403 } } });
  trace.observe({ method: 'Network.loadingFailed', params: { requestId: 'c', errorText: 'net::ERR_FAILED' } });
  trace.observe({ method: 'Network.requestWillBeSent', params: { requestId: 'd', request: { url: 'https://example.com/private', method: 'GET' } } });
  assert.equal(trace.snapshot().events.length, 0);
});
test('counts non-200 status codes', () => {
  const trace = createBrowserApiTrace();
  trace.observe({ method: 'Network.requestWillBeSent', params: { requestId: 'e', request: { url: u, method: 'GET' } } });
  trace.observe({ method: 'Network.responseReceived', params: { requestId: 'e', response: { url: u, status: 503 } } });
  assert.equal(trace.snapshot().non200Responses, 1);
});
test('bounds retained events and refuses unsafe limits', () => {
  assert.throws(() => createBrowserApiTrace(1000));
  const trace = createBrowserApiTrace(2);
  for (let i = 0; i < 8; i++) trace.observe({ method: 'Network.requestWillBeSent', params: { requestId: String(i), request: { url: u, method: 'GET' } } });
  assert.equal(trace.snapshot().retainedEvents, 2);
  assert.equal(trace.snapshot().totalEvents, 8);
});
