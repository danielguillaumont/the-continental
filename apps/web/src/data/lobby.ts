export type GettingStartedItem = {
  label: string;
  complete: boolean;
};

// These are planning prompts, not live completion statuses.
// The full guided onboarding flow will replace them in the UX/navigation slice.
export const gettingStartedItems: GettingStartedItem[] = [
  { label: "Continental initialized", complete: true },
  { label: "Add first experience", complete: false },
  { label: "Add first project", complete: false },
  { label: "Attach evidence", complete: false },
  { label: "Link evidence to a skill", complete: false },
];
