/** Trim and treat empty strings as absent optional values. */
export function optionalField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Display life years on tree nodes and profile summaries. */
export function formatLifeYears(
  birthDate?: string,
  deathDate?: string,
  birthDateApproximate?: boolean,
): string | null {
  const birth = birthDate?.trim();
  const death = deathDate?.trim();
  if (!birth && !death) return null;

  const approx = birthDateApproximate ? ' (approx.)' : '';

  if (birth && death) return `${birth} – ${death}${approx}`;
  if (birth) return `${birth}${approx}`;
  return `? – ${death}`;
}
