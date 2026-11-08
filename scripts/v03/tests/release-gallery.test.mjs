import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), "utf8");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const screenshotDir = "docs/screenshots/";

const expected = [
  "dossier-v03-evidence-match-hero.png",
  "dossier-v03-cloud-security-desktop.png",
  "dossier-v03-application-security-desktop.png",
  "dossier-v03-platform-reliability-desktop.png",
];

test("web package and lockfile are version 0.3.0", () => {
  const pkg = JSON.parse(read("apps/web/package.json"));
  const lock = JSON.parse(read("apps/web/package-lock.json"));
  assert.equal(pkg.version, "0.3.0");
  assert.equal(lock.version, "0.3.0");
  assert.equal(lock.packages[""].version, "0.3.0");
});

test("desktop and mobile shell display the current Evidence Match version", () => {
  for (const path of [
    "apps/web/src/components/shell/app-sidebar.tsx",
    "apps/web/src/components/shell/mobile-navigation.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /v0\.3 · Evidence Match/);
    assert.doesNotMatch(source, /Dossier in development|v0\.2/);
  }
  assert.match(read("apps/web/src/components/shell/context-bar.tsx"), /v0\.3\.0/);
});

test("all public README screenshot links point to reviewed local artifacts", () => {
  const readme = read("README.md");
  const manifestFile = resolve(root, `${screenshotDir}v03-capture-manifest.json`);
  assert.ok(existsSync(manifestFile), "run the screenshot publishing helper first");
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  assert.equal(manifest.images.length, 4);
  assert.equal(manifest.version, "v0.3.0-rc");
  const hashes = new Set();
  for (const name of expected) {
    assert.ok(readme.includes(`${screenshotDir}${name}`), `${name} absent from README`);
    const path = resolve(root, `${screenshotDir}${name}`);
    assert.ok(existsSync(path), `missing screenshot: ${name}`);
    const record = manifest.images.find((item) => item.file === name);
    assert.ok(record, `${name} absent from manifest`);
    assert.equal(record.fictional_demo_confirmed, true);
    assert.equal(record.manually_reviewed, true);
    const actualHash = hash(readFileSync(path));
    assert.equal(record.sha256, actualHash, `wrong hash for ${name}`);
    assert.ok(!hashes.has(actualHash), `duplicate screenshot: ${name}`);
    hashes.add(actualHash);
  }
});
