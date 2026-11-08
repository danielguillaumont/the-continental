import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyReadiness, nextReadOnlyRecovery, buildReadinessExpression, buildRecoveryClickExpression } from '../Capture-ContinentalV03Readiness.mjs';
import vm from 'node:vm';

const PATH = '/dossier/5c5827de-cfd4-48bc-9a08-fab046b5826b';
function ready() { return {
  path: PATH, title: true, company: true,
  dossierLoading: false, matchLoading: false, reviewLoading: false,
  matchSummary: true, requirementNavigator: true, reviewLedger: true, reviewReady: true,
  matchError: false, reviewError: false, canRetryMatch: false, canRefreshReviews: true,
}; }

test('accepts only a fully hydrated, error-free Dossier', () => {
  assert.equal(classifyReadiness(ready(), PATH).ready, true);
});
test('rejects a page with the correct identity but still loading matches or reviews', () => {
  assert.equal(classifyReadiness({...ready(), matchLoading: true}, PATH).reason, 'loading');
  assert.equal(classifyReadiness({...ready(), reviewLoading: true}, PATH).ready, false);
});
test('rejects a match API error even though the human review ledger is visible', () => {
  const snapshot = {...ready(), matchSummary: false, requirementNavigator: false,
    matchError: true, canRetryMatch: true};
  assert.equal(classifyReadiness(snapshot, PATH).reason, 'explicit-ui-error');
  assert.equal(nextReadOnlyRecovery(snapshot, {match: 0, reviews: 0}), 'retry-match');
  assert.equal(nextReadOnlyRecovery(snapshot, {match: 2, reviews: 0}), null);
});
test('rejects review ledger unavailable and supports a bounded read-only refresh', () => {
  const snapshot = {...ready(), reviewReady: false, reviewError: true};
  assert.equal(classifyReadiness(snapshot, PATH).ready, false);
  assert.equal(nextReadOnlyRecovery(snapshot, {match: 0, reviews: 1}), 'retry-reviews');
  assert.equal(nextReadOnlyRecovery(snapshot, {match: 0, reviews: 2}), null);
});
test('fails closed on wrong opportunity, empty match navigator and missing review summary', () => {
  assert.equal(classifyReadiness({...ready(), path: '/dossier/other'}, PATH).ready, false);
  assert.equal(classifyReadiness({...ready(), requirementNavigator: false}, PATH).ready, false);
  assert.equal(classifyReadiness({...ready(), reviewReady: false}, PATH).ready, false);
});
test('never requests generic retries when no explicit UI error is present', () => {
  assert.equal(nextReadOnlyRecovery({...ready(), matchSummary: false}, {match: 0, reviews: 0}), null);
  assert.equal(nextReadOnlyRecovery({...ready(), matchError: true, canRetryMatch: false}, {match: 0, reviews: 0}), null);
});

function fakeDOM(matchText, {matchError = false, reviewError = false} = {}) {
  const hits = { match: 0, reviews: 0, save: 0 };
  const matchButton = { innerText: 'Try again', disabled: false, click: () => hits.match++ };
  const reviewButton = { innerText: 'Refresh reviews', disabled: false, click: () => hits.reviews++ };
  const saveButton = { innerText: 'Save owner review', disabled: false, click: () => hits.save++ };
  const matchAlert = { innerText: 'Evidence Match is unavailable. HTTP 503.',
    querySelector: selector => selector === 'button' ? matchButton : null,
    querySelectorAll: selector => selector === 'button' ? [matchButton] : [] };
  const reviewAlert = { innerText: 'Could not load saved reviews.',
    querySelector: () => null, querySelectorAll: () => [] };
  const alerts = [...(matchError ? [matchAlert] : []), ...(reviewError ? [reviewAlert] : [])];
  const root = { innerText: matchText,
    querySelectorAll: selector => selector === '[role="alert"]' ? alerts :
      selector === 'button' ? [reviewButton, saveButton] : [] };
  const document = {
    readyState: 'complete',
    body: { innerText: `Cloud Security Engineer | Cedarline Cloud Operations (fictional) | ${matchText}` },
    getElementById: id => id === 'evidence-match' ? root : null,
  };
  return {document, location: {pathname: PATH}, hits};
}

test('real readiness browser expression accepts completed match and ledger UI', () => {
  const text = `From requirements to evidence. With evidence candidates Review needed
    Human review ledger 0 current owner decisions. Candidate matches are not reviewed automatically.
    Requirement navigator`;
  const context = fakeDOM(text);
  const expression = buildReadinessExpression('Cloud Security Engineer', 'Cedarline Cloud Operations (fictional)');
  const state = vm.runInNewContext(expression, context);
  assert.equal(state.reviewReady, true);
  assert.equal(state.matchSummary, true);
  assert.equal(state.requirementNavigator, true);
  assert.equal(classifyReadiness(state, PATH).ready, true);
});

test('real browser expression detects explicit match errors and clicks only Try again', () => {
  const context = fakeDOM('Human review ledger. 0 current owner decisions. Candidate matches are not reviewed automatically. Evidence Match is unavailable.', {matchError:true});
  const expression = buildReadinessExpression('Cloud Security Engineer', 'Cedarline Cloud Operations (fictional)');
  const state = vm.runInNewContext(expression, context);
  assert.equal(state.matchError, true);
  assert.equal(state.canRetryMatch, true);
  assert.equal(state.matchSummary, false);
  assert.equal(classifyReadiness(state, PATH).ready, false);
  assert.equal(vm.runInNewContext(buildRecoveryClickExpression('retry-match'), context), true);
  assert.deepEqual(context.hits, {match:1, reviews:0, save:0});
});

test('review retry selects only Refresh reviews and not the save button', () => {
  const context = fakeDOM('Human review ledger. Review actions unavailable; candidate discovery remains read-only.', {reviewError:true});
  assert.equal(vm.runInNewContext(buildRecoveryClickExpression('retry-reviews'), context), true);
  assert.equal(vm.runInNewContext(buildRecoveryClickExpression('other'), context), false);
  assert.deepEqual(context.hits, {match:0, reviews:1, save:0});
});
