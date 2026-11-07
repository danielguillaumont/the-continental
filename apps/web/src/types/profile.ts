/** Single-owner local profile. No user authentication or tenant isolation exists in v0.1. */
export type ProfileWritePayload = {
  fullName: string;
  headline: string | null;
  professionalSummary: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  targetRoles: string[];
  availableFrom: string | null;
};

export type ProfileRecord = ProfileWritePayload & {
  createdAt: string;
  updatedAt: string;
};
