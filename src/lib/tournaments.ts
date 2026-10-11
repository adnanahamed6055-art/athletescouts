export function canManageOpportunity(userId: string, ownerId: string | null): boolean {
  return Boolean(ownerId) && userId === ownerId;
}

export function validRegistrationUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password && !/\s/.test(value.trim());
  } catch {
    return false;
  }
}
/** Application status flow an organiser moves an applicant through. */
export const APPLICATION_STATUSES = ["submitted", "shortlisted", "accepted", "declined"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const STATUS_LABEL: Record<ApplicationStatus, string> = { submitted: "Sent to organiser", shortlisted: "Shortlisted", accepted: "Accepted", declined: "Not selected" };
export const isApplicationStatus = (s: string): s is ApplicationStatus => (APPLICATION_STATUSES as readonly string[]).includes(s);
