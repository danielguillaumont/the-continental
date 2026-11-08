import test from "node:test";
import assert from "node:assert/strict";
import { activeDestination, destinations } from "../src/lib/primary-navigation.ts";

test("eight implemented product destinations are exposed", () => {
  assert.deepEqual(Object.keys(destinations), ["profile", "overview", "projects", "experiences", "evidence", "skills", "certifications", "dossier"]);
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


test("experience index and details activate only Experience", () => {
  for (const path of ["/experiences", "/experiences/", "/experiences/1234"]) {
    assert.equal(activeDestination(path), "experiences");
  }
  assert.equal(activeDestination("/armory/projects/a"), "projects");
  assert.equal(activeDestination("/armory/new"), "evidence");
});


test("Skills index and detail activate only Skills", () => {
  assert.equal(activeDestination("/skills"), "skills");
  assert.equal(activeDestination("/skills/"), "skills");
  assert.equal(activeDestination("/skills/skill-uuid"), "skills");
  assert.equal(activeDestination("/armory/new"), "evidence");
});


test("Certification index and details activate Certifications only", () => {
  for (const path of ["/certifications", "/certifications/", "/certifications/credential-id"]) {
    assert.equal(activeDestination(path), "certifications");
  }
  assert.equal(activeDestination("/skills/skill-id"), "skills");
});


test("Profile route is active independently of the career record sections", () => {
  assert.equal(activeDestination("/profile"), "profile");
  assert.equal(activeDestination("/profile/"), "profile");
  assert.equal(activeDestination("/profiles"), null);
  assert.equal(activeDestination("/"), "overview");
  assert.equal(activeDestination("/experiences"), "experiences");
});


test("Dossier routes activate the independent opportunity destination", () => {
  for (const path of ["/dossier", "/dossier/new", "/dossier/uuid-123", "/dossier/"]) {
    assert.equal(activeDestination(path), "dossier", path);
  }
  assert.equal(activeDestination("/dossiers"), null);
  assert.equal(activeDestination("/armory"), "evidence");
});
