import test from "node:test";
import assert from "node:assert/strict";
import { activeDestination, destinations } from "../src/lib/primary-navigation.ts";

test("only three working product destinations are exposed", () => {
  assert.deepEqual(Object.keys(destinations), ["overview", "projects", "evidence"]);
});

test("project routes do not activate the evidence destination", () => {
  assert.equal(activeDestination("/armory/projects"), "projects");
  assert.equal(activeDestination("/armory/projects/"), "projects");
});

test("legacy evidence, create, view and edit routes stay under Evidence", () => {
  for (const url of ["/armory", "/armory/new", "/armory/evidence-id", "/armory/evidence-id/edit"]) {
    assert.equal(activeDestination(url), "evidence", url);
  }
});

test("Overview activates only at root", () => {
  assert.equal(activeDestination("/"), "overview");
  assert.equal(activeDestination("/unimplemented"), null);
});
