import type { CertificationRecord, CertificationWritePayload } from "../types/certification.ts";

export type CredentialStatus = "expired" | "expiring" | "active" | "no-expiration";

/** Calendar-day comparisons avoid locale-dependent Date.parse of date-only values. */
export function localToday(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function credentialStatus(expiresAt: string | null, today: string = localToday()): CredentialStatus {
  if (!expiresAt) return "no-expiration";
  if (expiresAt < today) return "expired";
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 30);
  const threshold = d.toISOString().slice(0, 10);
  return expiresAt <= threshold ? "expiring" : "active";
}

export const credentialStatusLabels: Record<CredentialStatus, string> = {
  expired: "Expired",
  expiring: "Expiring in 30 days",
  active: "Not expired",
  "no-expiration": "No expiration recorded",
};

export function formatCredentialDate(value: string | null): string {
  if (!value) return "Not recorded";
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return value;
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
}

export function credentialUrl(id: string): string {
  return `/certifications/${encodeURIComponent(id)}`;
}

export function filterCertifications(
  records: CertificationRecord[], query: string, status: CredentialStatus | "all" = "all", today: string = localToday(),
): CertificationRecord[] {
  const search = query.trim().toLowerCase();
  return records.filter((item) => {
    if (status !== "all" && credentialStatus(item.expiresAt, today) !== status) return false;
    return !search || [item.name, item.issuer, item.credentialId ?? "", item.description ?? ""]
      .some((value) => value.toLowerCase().includes(search));
  });
}

export function validateCertification(payload: CertificationWritePayload): string | null {
  if (payload.name.trim().length < 2 || payload.name.trim().length > 160) return "Enter a certification name (2–160 characters).";
  if (payload.issuer.trim().length < 2 || payload.issuer.trim().length > 160) return "Enter an issuer (2–160 characters).";
  if ((payload.credentialId?.length ?? 0) > 160) return "Credential ID must be 160 characters or fewer.";
  if ((payload.description?.length ?? 0) > 2000) return "Description must be 2,000 characters or fewer.";
  if (payload.credentialUrl) {
    try {
      const parsed = new URL(payload.credentialUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) return "Credential URL must begin with http:// or https://.";
    } catch { return "Enter a valid credential URL."; }
  }
  if (payload.issuedAt && payload.expiresAt && payload.expiresAt < payload.issuedAt) return "Expiration cannot be earlier than the issue date.";
  return null;
}
