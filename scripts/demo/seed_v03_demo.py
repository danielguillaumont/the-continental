#!/usr/bin/env python3
"""Conservative, opt-in HTTP seeder for The Continental v0.3 demo.

Default: read-only dry run. Writes require --apply and a verified private
PostgreSQL backup path plus SHA-256. No delete/PUT requests are performed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import ProxyHandler, Request, build_opener

FIXTURE_PATH = Path(__file__).with_name("v03-demo-data.json")
DEMO_ID = "continental.v03.demo.v1"


class SeedError(RuntimeError):
    """Safe-to-display seed validation or API error."""


def load_fixture(path: Path = FIXTURE_PATH) -> dict:
    fixture = json.loads(path.read_text(encoding="utf-8"))
    if fixture.get("fixtureId") != DEMO_ID:
        raise SeedError("Unexpected fixture identity; refuse to seed.")
    if len(fixture.get("projects", [])) != 3 or len(fixture.get("evidence", [])) != 5:
        raise SeedError("Unexpected project/evidence fixture count.")
    if len(fixture.get("opportunities", [])) != 3:
        raise SeedError("Unexpected opportunity fixture count.")
    projects = fixture["projects"]
    evidence = fixture["evidence"]
    opportunities = fixture["opportunities"]
    if len({item["name"] for item in projects}) != len(projects):
        raise SeedError("Duplicate fixture project name.")
    if len({item["title"] for item in evidence}) != len(evidence):
        raise SeedError("Duplicate fixture evidence title.")
    if len({item["title"] for item in opportunities}) != len(opportunities):
        raise SeedError("Duplicate fixture opportunity title.")
    project_names = {item["name"] for item in projects}
    for item in projects:
        if DEMO_ID not in item["summary"]:
            raise SeedError("Demo marker missing from project summary.")
    for item in evidence:
        if item["projectName"] not in project_names or DEMO_ID not in item["description"]:
            raise SeedError("Evidence fixture has invalid project or demo marker.")
        if item["status"] != "unverified" or not item["skills"]:
            raise SeedError("All demo evidence must be unverified and skill-tagged.")
        if item["source"].get("url"):
            raise SeedError("Demo sources must not link to real websites.")
    for item in opportunities:
        if DEMO_ID not in item["sourceText"] or "fictional" not in item["company"].lower():
            raise SeedError("Opportunity is missing its fictional demo disclosure.")
        if item["sourceUrl"] is not None:
            raise SeedError("Demo opportunity URLs must be null.")
        requirements = item["requirements"]
        if len(requirements) != 5 or len({r["text"] for r in requirements}) != 5:
            raise SeedError("Invalid demo requirement list.")
        for requirement in requirements:
            if requirement["text"] not in item["sourceText"]:
                raise SeedError("Requirement excerpt is not literal in source posting.")
            if requirement["kind"] not in ("required", "preferred"):
                raise SeedError("Invalid demo requirement kind.")
    return fixture


class HttpApi:
    def __init__(self, base: str):
        parts = urlsplit(base.rstrip("/"))
        if (parts.scheme != "http" or parts.hostname not in {"127.0.0.1", "localhost"}
                or parts.port != 8000 or parts.username or parts.password
                or parts.path or parts.query or parts.fragment):
            raise SeedError("Only local http://127.0.0.1:8000 is permitted.")
        self.base = f"http://{parts.hostname}:{parts.port}"
        # Never route requests to this local-only demo API through system proxies.
        self._opener = build_opener(ProxyHandler({}))
        # Previous 12-second deadline was too aggressive on some Windows setups.
        self._timeout_seconds = 45

    def request(self, method: str, path: str, payload: dict | None = None):
        if method not in ("GET", "POST") or not path.startswith("/"):
            raise SeedError("Unsupported API operation.")
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
        request = Request(
            self.base + path, data=body, method=method,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        start = time.monotonic()
        if method == "POST":
            print(f"HTTP START: {method} {path}", flush=True)
        try:
            with self._opener.open(request, timeout=self._timeout_seconds) as response:
                data = response.read()
                status = response.status
            if method == "POST":
                elapsed = time.monotonic() - start
                print(f"HTTP OK: {method} {path} ({status}; {elapsed:.2f}s)", flush=True)
            return json.loads(data) if data else None
        except HTTPError as error:
            # Do not dump request bodies; they may contain user-entered data.
            raise SeedError(f"API {method} {path} rejected with HTTP {error.code}.") from error
        except (URLError, TimeoutError, OSError) as error:
            elapsed = time.monotonic() - start
            raise SeedError(
                f"API {method} {path} failed after {elapsed:.1f}s "
                f"({type(error).__name__}). "
                "Do not retry an uncertain POST; rerun the read-only dry run to reconcile."
            ) from error

    def get(self, path: str):
        return self.request("GET", path)

    def post(self, path: str, payload: dict | None = None):
        return self.request("POST", path, payload)


def unique_existing(records: list[dict], key: str, value: str, category: str):
    matches = [item for item in records if item.get(key) == value]
    if len(matches) > 1:
        raise SeedError(f"Duplicate {category} records named {value!r}; manual review required.")
    return matches[0] if matches else None


def expect_fields(existing: dict, expected: dict, fields: tuple[str, ...], category: str):
    for field in fields:
        if existing.get(field) != expected.get(field):
            raise SeedError(
                f"{category} {existing.get('title') or existing.get('name')!r} has "
                f"a changed {field!r}; refusing to modify an existing record."
            )


def preflight(api, fixture: dict) -> dict:
    """GET-only snapshot and collision checks. Run before *any* POST."""
    health = api.get("/health")
    if health.get("status") != "ok":
        raise SeedError("Local API is not healthy.")
    schema = api.get("/openapi.json")
    if "/opportunities/{opportunity_id}/evidence-match-preview" not in schema.get("paths", {}):
        raise SeedError("The local API does not expose v0.3 Evidence Match; stop.")
    state = {
        "projects": api.get("/projects"),
        "evidence": api.get("/evidence"),
        "opportunities": api.get("/opportunities"),
    }
    for category in state:
        if not isinstance(state[category], list):
            raise SeedError(f"Malformed {category} API response.")
    for expected in fixture["projects"]:
        existing = unique_existing(state["projects"], "name", expected["name"], "project")
        if existing:
            expect_fields(existing, expected,
                          ("name", "summary", "repositoryUrl", "status"), "Project")
    for expected in fixture["evidence"]:
        existing = unique_existing(state["evidence"], "title", expected["title"], "evidence")
        if existing:
            expect_fields(existing, expected,
                          ("title", "kind", "description", "status", "occurredAt"),
                          "Evidence")
            source = existing.get("source") or {}
            if source.get("label") != expected["source"]["label"] or source.get("url") is not None:
                raise SeedError(f"Evidence {expected['title']!r} has modified source attribution; stop.")
            if sorted(s.casefold() for s in existing.get("skills", [])) != sorted(
                s.casefold() for s in expected["skills"]
            ):
                raise SeedError(f"Evidence {expected['title']!r} has modified skills; stop.")
    for expected in fixture["opportunities"]:
        # A demo title must not silently attach to a different real posting.
        existing = unique_existing(state["opportunities"], "title", expected["title"], "opportunity")
        if existing:
            expect_fields(existing, expected,
                          ("title", "company", "location", "employmentType", "salaryText",
                           "sourceUrl", "technologies", "sourceText"), "Opportunity")
            seen = set()
            for requirement in existing.get("requirements", []):
                if requirement["text"] in seen:
                    raise SeedError("Repeated requirement in an existing demo opportunity.")
                seen.add(requirement["text"])
                expected_req = next((r for r in expected["requirements"] if r["text"] == requirement["text"]), None)
                if expected_req and (
                    requirement["kind"] != expected_req["kind"] or
                    requirement.get("sourceExcerpt") != expected_req["text"]
                ):
                    raise SeedError("Existing demo requirement was manually changed; stop.")
    return state


def build_plan(state: dict, fixture: dict) -> list[tuple[str, str, str]]:
    operations = []
    for item in fixture["projects"]:
        existing = unique_existing(state["projects"], "name", item["name"], "project")
        operations.append(("KEEP" if existing else "CREATE", "project", item["name"]))
    for item in fixture["evidence"]:
        existing = unique_existing(state["evidence"], "title", item["title"], "evidence")
        operations.append(("KEEP" if existing else "CREATE", "evidence", item["title"]))
        project = unique_existing(state["projects"], "name", item["projectName"], "project")
        linked = project is not None and existing is not None and any(
            record["id"] == existing["id"] for record in project.get("evidence", [])
        )
        operations.append(("KEEP" if linked else "LINK", "project/evidence", item["title"]))
    for item in fixture["opportunities"]:
        existing = unique_existing(state["opportunities"], "title", item["title"], "opportunity")
        operations.append(("KEEP" if existing else "CREATE", "opportunity", item["title"]))
        for requirement in item["requirements"]:
            has_req = existing is not None and any(
                r["text"] == requirement["text"] for r in existing.get("requirements", [])
            )
            operations.append(("KEEP" if has_req else "CREATE", "requirement", requirement["text"]))
    return operations


def apply(api, fixture: dict, state: dict) -> dict[str, int]:
    """Only creates missing fixture-owned objects and links; never mutates existing ones."""
    counts = {"projects": 0, "evidence": 0, "opportunities": 0, "requirements": 0, "links": 0}
    projects = {}
    evidence_by_title = {}
    opportunities = {}
    for item in fixture["projects"]:
        record = unique_existing(state["projects"], "name", item["name"], "project")
        if record is None:
            record = api.post("/projects", item)
            counts["projects"] += 1
        projects[item["name"]] = record
    for item in fixture["evidence"]:
        record = unique_existing(state["evidence"], "title", item["title"], "evidence")
        if record is None:
            payload = {k: v for k, v in item.items() if k != "projectName"}
            record = api.post("/evidence", payload)
            counts["evidence"] += 1
        evidence_by_title[item["title"]] = record
    for item in fixture["evidence"]:
        project = projects[item["projectName"]]
        evidence = evidence_by_title[item["title"]]
        if not any(record["id"] == evidence["id"] for record in project.get("evidence", [])):
            project = api.post(f"/projects/{project['id']}/evidence/{evidence['id']}")
            projects[item["projectName"]] = project
            counts["links"] += 1
    for item in fixture["opportunities"]:
        record = unique_existing(state["opportunities"], "title", item["title"], "opportunity")
        if record is None:
            payload = {k: v for k, v in item.items() if k != "requirements"}
            record = api.post("/opportunities", payload)
            counts["opportunities"] += 1
        opportunities[item["title"]] = record
        for requirement in item["requirements"]:
            if any(r["text"] == requirement["text"] for r in record.get("requirements", [])):
                continue
            result = api.post(f"/opportunities/{record['id']}/requirements", {
                "text": requirement["text"], "kind": requirement["kind"],
                "sourceExcerpt": requirement["text"],
            })
            record["requirements"].append(result)
            counts["requirements"] += 1
    return counts


def verify(api, fixture: dict) -> dict:
    """Reopen every demo opportunity and inspect its real matching endpoint."""
    state = preflight(api, fixture)
    for item in fixture["projects"]:
        project = unique_existing(state["projects"], "name", item["name"], "project")
        if project is None:
            raise SeedError("Expected demo project is missing.")
        expected_evidence = [e for e in fixture["evidence"] if e["projectName"] == item["name"]]
        linked_titles = {e["title"] for e in project["evidence"]}
        if any(e["title"] not in linked_titles for e in expected_evidence):
            raise SeedError("Demo project does not have its expected evidence links.")
    for item in fixture["evidence"]:
        if unique_existing(state["evidence"], "title", item["title"], "evidence") is None:
            raise SeedError("Demo evidence record is missing.")
    summaries = {}
    for item in fixture["opportunities"]:
        record = unique_existing(state["opportunities"], "title", item["title"], "opportunity")
        if record is None:
            raise SeedError("Demo opportunity is missing.")
        requirements = {r["text"] for r in record.get("requirements", [])}
        if any(r["text"] not in requirements for r in item["requirements"]):
            raise SeedError("Demo opportunity is missing a requirement.")
        preview = api.get(f"/opportunities/{record['id']}/evidence-match-preview")
        if preview.get("mode") != "deterministic_explicit_skill_tags":
            raise SeedError("Evidence match preview changed its contract.")
        if preview["summary"]["totalRequirements"] < len(item["requirements"]):
            raise SeedError("Evidence match preview omitted requirements.")
        if preview["summary"]["candidatesFound"] < 1:
            raise SeedError("Demo match has no candidate evidence; check skill tags.")
        summaries[item["title"]] = preview["summary"]
    return summaries


def validate_backup(path_string: str | None, expected_sha256: str | None) -> None:
    if not path_string or not expected_sha256:
        raise SeedError("--apply requires --backup-file and --backup-sha256.")
    path = Path(path_string).resolve()
    if not path.is_file() or path.suffix.lower() != ".dump":
        raise SeedError("Verified PostgreSQL custom-format .dump backup file is required.")
    if path.stat().st_size < 100:
        raise SeedError("Backup is unexpectedly small.")
    digest = hashlib.sha256()
    with path.open("rb") as archive:
        for chunk in iter(lambda: archive.read(1024 * 1024), b""):
            digest.update(chunk)
    actual = digest.hexdigest()
    if actual.casefold() != expected_sha256.casefold():
        raise SeedError("Private backup SHA-256 mismatch. Stop without writing.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-base", default="http://127.0.0.1:8000")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="Opt in to creating demo records")
    mode.add_argument("--verify", action="store_true", help="Verify existing demo data without writes")
    parser.add_argument("--backup-file", help="Private pg_dump archive (required for --apply)")
    parser.add_argument("--backup-sha256", help="SHA-256 fingerprint of archive")
    args = parser.parse_args(argv)
    try:
        fixture = load_fixture()
        api = HttpApi(args.api_base)
        # No mutation occurs before verifying the entire fixture and API snapshot.
        state = preflight(api, fixture)
        if args.verify:
            summaries = verify(api, fixture)
            for title, summary in summaries.items():
                print(f"VERIFIED {title}: {summary}")
            print("PASS: demo records and matching previews validated")
            return 0
        plan = build_plan(state, fixture)
        print(f"Fixture: {DEMO_ID} — FICTIONAL examples only")
        for operation, category, title in plan:
            print(f"{operation:6} {category:17} {title}")
        counts = {action: sum(kind == action for kind, _, _ in plan) for action in ("CREATE", "LINK", "KEEP")}
        print(f"Plan totals: {counts}")
        if not args.apply:
            print("DRY RUN ONLY: no records written. Apply via the guarded PowerShell wrapper.")
            return 0
        validate_backup(args.backup_file, args.backup_sha256)
        result = apply(api, fixture, state)
        summaries = verify(api, fixture)
        print(f"Created/linked: {result}")
        for title, summary in summaries.items():
            print(f"MATCH PREVIEW {title}: {summary}")
        print("PASS: fictional demo data seeded and verified")
        return 0
    except (SeedError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        print(f"STOP: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
