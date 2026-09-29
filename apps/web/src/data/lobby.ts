export type EvidenceItem = {
  source: string;
  title: string;
  description: string;
  skills: string[];
  date: string;
  verified: boolean;
};

export type GettingStartedItem = {
  label: string;
  complete: boolean;
};

export const evidenceItems: EvidenceItem[] = [
  {
    source: "Project",
    title: "Shodan Automation",
    description:
      "Automated recurring external exposure reporting using Python and Azure DevOps.",
    skills: ["Python", "Azure DevOps", "Security Automation"],
    date: "Jul 2026",
    verified: true,
  },
  {
    source: "Project",
    title: "Wayne Enterprises Endpoint Diagnostic",
    description:
      "Built a PowerShell diagnostic tool for Windows system health, networking, and security posture.",
    skills: ["PowerShell", "Windows", "Networking"],
    date: "Sep 2026",
    verified: true,
  },
  {
    source: "Project",
    title: "Project Hallows",
    description:
      "Designed a segmented cybersecurity homelab using OPNsense, VMware, Ubuntu, and firewall policy.",
    skills: ["Networking", "OPNsense", "Linux"],
    date: "Sep 2026",
    verified: true,
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