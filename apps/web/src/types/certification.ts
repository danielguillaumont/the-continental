/** Issuer details and URLs are owner-entered; no issuer verification is implied. */
export type CertificationSkill = { id: string; name: string };
export type CertificationEvidence = {
  id: string;
  title: string;
  kind: string;
  status: "verified" | "unverified";
};

export type CertificationWritePayload = {
  name: string;
  issuer: string;
  credentialId: string | null;
  credentialUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  description: string | null;
};

export type CertificationRecord = CertificationWritePayload & {
  id: string;
  skills: CertificationSkill[];
  evidence: CertificationEvidence[];
  createdAt: string;
  updatedAt: string;
};
