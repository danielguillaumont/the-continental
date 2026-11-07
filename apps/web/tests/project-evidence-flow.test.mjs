import test from "node:test";
import assert from "node:assert/strict";
import { isProjectContextId, createEvidenceForProjectUrl, createAndLinkEvidence, retryProjectLink } from "../src/lib/project-evidence-flow.ts";

const projectId = "e32073ea-2e76-4dac-b855-c8ade1637fae";

test("project context allows UUIDs but never external or arbitrary redirects", () => {
  assert.equal(isProjectContextId(projectId), true);
  for (const unsafe of ["https://evil.example", "../../", "project-hallows", "", [projectId], undefined]) {
    assert.equal(isProjectContextId(unsafe), false);
  }
  assert.equal(createEvidenceForProjectUrl(projectId), `/armory/new?project=${projectId}`);
});

test("successful creation links once to the intended project", async () => {
  let created = 0; const links = [];
  const outcome = await createAndLinkEvidence(projectId, { title: "QA" }, async () => { created++; return { id: "evidence-1" }; }, async (p, e) => { links.push([p, e]); });
  assert.deepEqual(outcome, { kind: "linked", evidenceId: "evidence-1" });
  assert.equal(created, 1);
  assert.deepEqual(links, [[projectId, "evidence-1"]]);
});

test("failed create does not attempt to attach", async () => {
  let attachments = 0;
  await assert.rejects(createAndLinkEvidence(projectId, { title: "QA" }, async () => { throw new Error("Save failed"); }, async () => { attachments++; }), /Save failed/);
  assert.equal(attachments, 0);
});

test("failed attachment preserves the saved ID and retry does not create again", async () => {
  let created = 0; let attached = 0;
  const outcome = await createAndLinkEvidence(projectId, { title: "QA" }, async () => { created++; return { id: "evidence-2" }; }, async () => { attached++; throw new Error("Temporary failure"); });
  assert.deepEqual(outcome, { kind: "saved-unlinked", evidenceId: "evidence-2", reason: "Temporary failure" });
  let retryCalled = 0;
  await retryProjectLink(projectId, outcome.evidenceId, async (p, e) => {
    retryCalled++;
    assert.deepEqual([p, e], [projectId, "evidence-2"]);
  });
  assert.equal(created, 1);
  assert.equal(attached, 1);
  assert.equal(retryCalled, 1);
});

test("retry failure can be retried without invoking creation", async () => {
  await assert.rejects(retryProjectLink(projectId, "evidence-3", async () => { throw new Error("Still offline"); }), /Still offline/);
});
