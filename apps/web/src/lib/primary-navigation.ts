/** Primary destinations. Keep URLs stable until a separate route migration is tested. */
export const destinations = {
  profile: { href: "/profile", label: "Profile", description: "Your professional identity and career direction" },
  overview: { href: "/", label: "Overview", description: "Your workspace and next steps" },
  projects: { href: "/armory/projects", label: "Projects", description: "What you built and its supporting proof" },
  experiences: { href: "/experiences", label: "Experience", description: "Your roles and accomplishments" },
  evidence: { href: "/armory", label: "Evidence", description: "Reusable records that support your work" },
  skills: { href: "/skills", label: "Skills", description: "Your capabilities and the proof behind them" },
  certifications: { href: "/certifications", label: "Certifications", description: "Credentials and supporting records" },
} as const;

export type Destination = keyof typeof destinations;

/** The projects URL is nested for compatibility, but is a PRIMARY destination. */
export function activeDestination(pathname: string): Destination | null {
  if (pathname === "/") return "overview";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "profile";
  if (pathname === "/skills" || pathname.startsWith("/skills/")) return "skills";
  if (pathname === "/certifications" || pathname.startsWith("/certifications/")) return "certifications";
  if (pathname === "/experiences" || pathname.startsWith("/experiences/")) return "experiences";
  if (pathname === "/armory/projects" || pathname.startsWith("/armory/projects/")) return "projects";
  if (pathname === "/armory" || pathname.startsWith("/armory/")) return "evidence";
  return null;
}
