import assert from "node:assert/strict";
import test from "node:test";

import {
  employmentLabels, experiencePeriod, experienceProofCount, experienceUrl,
  filterExperiences, isCurrentExperience, parseHighlights, validateExperience,
} from "../src/lib/experience-workspace.ts";

const sample = {
  id: "sample-id",
  organization: "Example Org",
  title: "Systems Engineer",
  employmentType: "full_time",
  location: "Ontario",
  startDate: "2024-03-01",
  endDate: null,
  description: "Maintained production infrastructure.",
  highlights: ["Reduced manual checks"],
  projects: [{ id: "project-1", name: "Monitor", status: "active" }],
  evidence: [{ id: "evidence-1", title: "Monitoring proof", kind: "artifact", status: "verified" }],
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
};

test("Experience has an independent top-level destination", () => {
  assert.equal(experienceUrl("abc"), "/experiences/abc");
  assert.equal(experienceUrl("a/b"), "/experiences/a%2Fb");
});

test("employment labels cover the complete backend enum", () => {
  assert.deepEqual(Object.keys(employmentLabels), [
    "full_time", "part_time", "contract", "internship", "freelance", "volunteer", "other",
  ]);
});

test("period is readable for current and completed roles", () => {
  assert.equal(experiencePeriod(sample), "Mar 2024 – Present");
  assert.equal(experiencePeriod({ startDate: "2023-01-01", endDate: "2024-02-29" }), "Jan 2023 – Feb 2024");
  assert.equal(isCurrentExperience(sample), true);
  assert.equal(isCurrentExperience({ endDate: "2024-03-01" }), false);
});

test("counts linked projects and evidence without duplicating either", () => {
  assert.equal(experienceProofCount(sample), 2);
  assert.equal(experienceProofCount({ projects: [], evidence: [] }), 0);
});

test("search matches employer, role and location case insensitively", () => {
  assert.equal(filterExperiences([sample], "engineer").length, 1);
  assert.equal(filterExperiences([sample], " example ").length, 1);
  assert.equal(filterExperiences([sample], "ONTARIO").length, 1);
  assert.equal(filterExperiences([sample], "unrelated").length, 0);
});

test("highlights are one-per-line and blank lines do not become records", () => {
  assert.deepEqual(parseHighlights(" First outcome \n\n Second outcome  \r\n"), ["First outcome", "Second outcome"]);
});

test("valid role passes backend-compatible field constraints", () => {
  assert.equal(validateExperience(sample), null);
});

test("dates and real calendar days are validated", () => {
  assert.match(validateExperience({ ...sample, startDate: "" }), /start date/);
  assert.match(validateExperience({ ...sample, startDate: "2025-02-30" }), /start date/);
  assert.match(validateExperience({ ...sample, endDate: "2023-01-01" }), /end date/);
  assert.equal(validateExperience({ ...sample, endDate: "2024-03-01" }), null);
});

test("accomplishment length, duplicates and maximum count are rejected", () => {
  assert.match(validateExperience({ ...sample, highlights: ["No"] }), /3–300/);
  assert.match(validateExperience({ ...sample, highlights: ["Built scanner", "built scanner"] }), /duplicate/);
  assert.match(validateExperience({ ...sample, highlights: Array.from({ length: 13 }, (_, i) => `Outcome ${i}`) }), /12/);
});

test("meaningful organization, title and descriptions are required", () => {
  assert.match(validateExperience({ ...sample, organization: "   " }), /employer/);
  assert.match(validateExperience({ ...sample, title: "" }), /role title/);
  assert.match(validateExperience({ ...sample, description: "short" }), /10 characters/);
});
