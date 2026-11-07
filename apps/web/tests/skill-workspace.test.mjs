import test from "node:test";
import assert from "node:assert/strict";
import { activeDestination } from "../src/lib/primary-navigation.ts";
import { filterSkills, countSkillCoverage, proofCountLabel, skillCoverageLabels, skillUrl } from "../src/lib/skill-workspace.ts";

const records = [
  { id: "a", name: "Python", coverage: "verified", evidenceCount: 2, verifiedCount: 1, unverifiedCount: 1 },
  { id: "b", name: "Terraform", coverage: "unverified", evidenceCount: 1, verifiedCount: 0, unverifiedCount: 1 },
  { id: "c", name: "Go", coverage: "unsupported", evidenceCount: 0, verifiedCount: 0, unverifiedCount: 0 },
];

test("Skill routes stay in the Skills destination", () => {
  for (const path of ["/skills", "/skills/", "/skills/1234"]) {
    assert.equal(activeDestination(path), "skills");
  }
  assert.equal(activeDestination("/armory/1234"), "evidence");
});

test("Search matches skill names without case or whitespace sensitivity", () => {
  assert.deepEqual(filterSkills(records, "  PYTh  ").map((record) => record.name), ["Python"]);
  assert.equal(filterSkills(records, "no-such-skill").length, 0);
  assert.equal(filterSkills(records, " ").length, 3);
});

test("Status filters are independent of search", () => {
  assert.deepEqual(filterSkills(records, "", "verified").map((item) => item.id), ["a"]);
  assert.deepEqual(filterSkills(records, "", "unverified").map((item) => item.id), ["b"]);
  assert.deepEqual(filterSkills(records, "", "unsupported").map((item) => item.id), ["c"]);
  assert.deepEqual(filterSkills(records, "ter", "unverified").map((item) => item.id), ["b"]);
  assert.equal(filterSkills(records, "go", "verified").length, 0);
});

test("Coverage counts reflect backend states and don't manufacture scores", () => {
  assert.equal(countSkillCoverage(records, "verified"), 1);
  assert.equal(countSkillCoverage(records, "unverified"), 1);
  assert.equal(countSkillCoverage(records, "unsupported"), 1);
  assert.deepEqual(Object.keys(skillCoverageLabels), ["verified", "unverified", "unsupported"]);
});

test("URL encoding and proof count labels remain stable", () => {
  assert.equal(skillUrl("a/b"), "/skills/a%2Fb");
  assert.equal(proofCountLabel(1), "1 evidence record");
  assert.equal(proofCountLabel(2), "2 evidence records");
  assert.equal(proofCountLabel(0), "0 evidence records");
});
