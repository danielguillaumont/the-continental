import test from "node:test";
import assert from "node:assert/strict";
import { projectDetailsUrl, projectStatusLabel, proofCountLabel, projectProofState } from "../src/lib/project-workspace.ts";
import { activeDestination } from "../src/lib/primary-navigation.ts";

test("project details have a stable, encoded URL", () => {
  assert.equal(projectDetailsUrl("f4601183-7bd3-4013-ab4b-6f905c16b297"), "/armory/projects/f4601183-7bd3-4013-ab4b-6f905c16b297");
  assert.equal(projectDetailsUrl("project id"), "/armory/projects/project%20id");
});

test("project detail routes activate Projects, not Evidence", () => {
  assert.equal(activeDestination(projectDetailsUrl("abc")), "projects");
  assert.equal(activeDestination("/armory/projects/abc"), "projects");
  assert.equal(activeDestination("/armory/evidence-id"), "evidence");
});

test("every supported project status has a human-readable label", () => {
  assert.equal(projectStatusLabel("active"), "In progress");
  assert.equal(projectStatusLabel("completed"), "Completed");
  assert.equal(projectStatusLabel("paused"), "On hold");
});

test("proof count handles singular and plural", () => {
  assert.equal(proofCountLabel(0), "0 evidence records");
  assert.equal(proofCountLabel(1), "1 evidence record");
  assert.equal(proofCountLabel(3), "3 evidence records");
});

test("project proof state reflects linked evidence", () => {
  assert.equal(projectProofState({ evidence: [] }), "needs-proof");
  assert.equal(projectProofState({ evidence: [{ id: "x" }] }), "supported");
});
