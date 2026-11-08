// Pure, side-effect-free readiness classification. No database or network access.
// All conditions are backed by the v0.3 Dossier's actual rendered UI states.
export function classifyReadiness(s, expectedPath) {
  const identity = s.path === expectedPath && s.title === true && s.company === true;
  const noLoading = !s.dossierLoading && !s.matchLoading && !s.reviewLoading;
  const matchComplete = s.matchSummary === true && s.requirementNavigator === true;
  const ledgerComplete = s.reviewLedger === true && s.reviewReady === true;
  const noErrors = !s.matchError && !s.reviewError;
  return {
    ready: Boolean(identity && noLoading && matchComplete && ledgerComplete && noErrors),
    identity, noLoading, matchComplete, ledgerComplete, noErrors,
    reason: !identity ? 'identity' : !noErrors ? 'explicit-ui-error' :
      !noLoading ? 'loading' : !matchComplete ? 'missing-evidence-match' :
      !ledgerComplete ? 'missing-review-ledger' : 'ready',
  };
}

// Only allow bounded retries of two known read-only UI operations.
// No generic button clicking, refreshing the whole page, or data mutations.
export function nextReadOnlyRecovery(s, counts, maxRetries = 2) {
  if (s.matchError && s.canRetryMatch && counts.match < maxRetries) return 'retry-match';
  if (s.reviewError && s.canRefreshReviews && counts.reviews < maxRetries) return 'retry-reviews';
  return null;
}


// Build actual browser expressions here so tests can evaluate them against
// mocked DOM states. String.raw keeps regex \b word boundaries intact.
export function buildReadinessExpression(jobTitle, company) {
  return String.raw`(() => {
    const bodyText = document.body?.innerText || '';
    const root = document.getElementById('evidence-match');
    const matchText = root?.innerText || '';
    const alerts = root ? Array.from(root.querySelectorAll('[role="alert"]')) : [];
    const matchAlert = alerts.find(node => (node.innerText || '').includes('Evidence Match is unavailable'));
    const reviewAlert = alerts.find(node => node !== matchAlert);
    const buttons = root ? Array.from(root.querySelectorAll('button')) : [];
    const hasButton = (name) => buttons.some(node => !node.disabled && (node.innerText || '').trim() === name);
    return {
      path: location.pathname,
      title: bodyText.includes(${JSON.stringify(jobTitle)}),
      company: bodyText.includes(${JSON.stringify(company)}),
      dossierLoading: /Loading the Dossier/i.test(bodyText),
      matchLoading: /Finding candidate evidence|Loading (?:evidence |candidate )?matches/i.test(matchText),
      reviewLoading: /Loading (?:saved |human )?review decisions|Loading saved reviews/i.test(matchText),
      matchSummary: matchText.includes('With evidence candidates') && matchText.includes('Review needed'),
      requirementNavigator: /Requirement navigator/i.test(matchText),
      reviewLedger: matchText.includes('Human review ledger'),
      reviewReady: /current owner decisions?\b/i.test(matchText) && matchText.includes('Candidate matches are not reviewed automatically.'),
      matchError: Boolean(matchAlert),
      reviewError: Boolean(reviewAlert) || matchText.includes('Review actions unavailable; candidate discovery remains read-only.'),
      matchErrorText: (matchAlert?.innerText || '').slice(0, 350),
      reviewErrorText: (reviewAlert?.innerText || '').slice(0, 350),
      canRetryMatch: Boolean(matchAlert?.querySelector('button') && !matchAlert.querySelector('button').disabled && (matchAlert.querySelector('button').innerText || '').trim() === 'Try again'),
      canRefreshReviews: hasButton('Refresh reviews'),
      htmlReady: document.readyState
    };
  })()`;
}

export function buildRecoveryClickExpression(action) {
  return String.raw`(() => {
    const root = document.getElementById('evidence-match');
    if (!root) return false;
    if (${JSON.stringify(action)} === 'retry-match') {
      const alert = Array.from(root.querySelectorAll('[role="alert"]')).find(node => (node.innerText || '').includes('Evidence Match is unavailable'));
      const button = alert && Array.from(alert.querySelectorAll('button')).find(node => !node.disabled && (node.innerText || '').trim() === 'Try again');
      if (!button) return false;
      button.click();
      return true;
    }
    if (${JSON.stringify(action)} === 'retry-reviews') {
      const buttons = Array.from(root.querySelectorAll('button'));
      const button = buttons.find(node => !node.disabled && (node.innerText || '').trim() === 'Refresh reviews');
      if (!button) return false;
      button.click();
      return true;
    }
    return false;
  })()`;
}
