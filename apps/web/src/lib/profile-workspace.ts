import type { ProfileRecord, ProfileWritePayload } from "../types/profile.ts";

export type ProfileDraft = {
  fullName: string;
  headline: string;
  professionalSummary: string;
  location: string;
  email: string;
  phone: string;
  websiteUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  targetRolesText: string;
  availableFrom: string;
};

const optional = (value: string): string | null => value.trim() || null;

export function draftFromProfile(profile: ProfileRecord | null): ProfileDraft {
  return {
    fullName: profile?.fullName ?? "",
    headline: profile?.headline ?? "",
    professionalSummary: profile?.professionalSummary ?? "",
    location: profile?.location ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    targetRolesText: profile?.targetRoles.join("\n") ?? "",
    availableFrom: profile?.availableFrom ?? "",
  };
}

export function parseTargetRoles(text: string): string[] {
  const seen = new Set<string>();
  const roles: string[] = [];
  for (const value of text.split(/\r?\n/)) {
    const role = value.trim();
    const key = role.toLocaleLowerCase();
    if (role && !seen.has(key)) { roles.push(role); seen.add(key); }
  }
  return roles;
}

export function profilePayload(draft: ProfileDraft): ProfileWritePayload {
  return {
    fullName: draft.fullName.trim(),
    headline: optional(draft.headline),
    professionalSummary: optional(draft.professionalSummary),
    location: optional(draft.location),
    email: optional(draft.email),
    phone: optional(draft.phone),
    websiteUrl: optional(draft.websiteUrl),
    githubUrl: optional(draft.githubUrl),
    linkedinUrl: optional(draft.linkedinUrl),
    targetRoles: parseTargetRoles(draft.targetRolesText),
    availableFrom: optional(draft.availableFrom),
  };
}

/** Return null for anything that should not become a clickable external link. */
export function safeExternalUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch { return null; }
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateProfile(profile: ProfileWritePayload): string | null {
  if (profile.fullName.length < 2 || profile.fullName.length > 160) return "Enter your name (2–160 characters).";
  const textFields: Array<[string | null, number, string]> = [
    [profile.headline, 200, "Headline"],
    [profile.professionalSummary, 4000, "Professional summary"],
    [profile.location, 160, "Location"],
    [profile.email, 254, "Email"],
    [profile.phone, 40, "Phone"],
  ];
  for (const [value, max, label] of textFields) {
    if (value !== null && value.length > max) return `${label} must be ${max} characters or fewer.`;
  }
  if (profile.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) return "Enter a valid email address.";
  for (const [label, value] of [["Website", profile.websiteUrl], ["GitHub", profile.githubUrl], ["LinkedIn", profile.linkedinUrl]] as const) {
    if (value && !safeExternalUrl(value)) return `${label} must be a valid http:// or https:// URL without embedded credentials.`;
  }
  if (profile.targetRoles.length > 12) return "Add no more than 12 target roles.";
  if (profile.targetRoles.some((role) => role.length < 1 || role.length > 120)) return "Each target role must be 1–120 characters.";
  if (profile.availableFrom && !validDate(profile.availableFrom)) return "Choose a valid availability date.";
  return null;
}

export function formatProfileDate(value: string | null): string | null {
  if (!value || !validDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}
