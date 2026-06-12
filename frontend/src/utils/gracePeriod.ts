export const EDIT_GRACE_DAYS = 7;

export function editDaysRemaining(createdAt?: string): number {
  if (!createdAt) return 0;
  const end = new Date(createdAt).getTime() + EDIT_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}
