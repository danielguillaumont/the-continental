import type { EvidenceRecord } from "@/types/evidence";

export type GettingStartedItem = {
  label: string;
  complete: boolean;
};

export const evidenceItems: EvidenceRecord[] = [
  {
    id: "shodan-automation",
    kind: "project",
    title: "Shodan Automation",
    description:
      "Automated recurring external exposure reporting using Python and Azure DevOps.",
    skills: ["Python", "Azure DevOps", "Security Automation"],
    status: "verified",
    source: {
      label: "Project evidence",
    },
    occurredAt: "2026-07-01",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
  {
    id: "wayne-enterprises-endpoint-diagnostic",
    kind: "project",
    title: "Wayne Enterprises Endpoint Diagnostic",
    description:
      "Built a PowerShell diagnostic tool for Windows system health, networking, and security posture.",
    skills: ["PowerShell", "Windows", "Networking"],
    status: "verified",
    source: {
      label: "Project repository",
    },
    occurredAt: "2026-09-01",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
  {
    id: "project-hallows",
    kind: "project",
    title: "Project Hallows",
    description:
      "Designed a segmented cybersecurity homelab using OPNsense, VMware, Ubuntu, and firewall policy.",
    skills: ["Networking", "OPNsense", "Linux"],
    status: "verified",
    source: {
      label: "Homelab documentation",
    },
    occurredAt: "2026-09-01",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
];

export const gettingStartedItems: GettingStartedItem[] = [
  {
    label: "Continental initialized",
    complete: true,
  },
  {
    label: "Add first experience",
    complete: false,
  },
  {
    label: "Add first project",
    complete: false,
  },
  {
    label: "Attach evidence",
    complete: false,
  },
  {
    label: "Link evidence to a skill",
    complete: false,
  },
];