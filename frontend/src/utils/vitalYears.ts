/** Deceased but death year not known. */
export const UNKNOWN_DEATH_YEAR = 'unknown';
/** Explicitly marked alive. */
export const LIVING_MARKER = 'living';

export type LifeStatus = 'unspecified' | 'alive' | 'deceased';
export type BirthMode = 'unknown' | 'year';

export interface LifeDisplay {
  primary: string | null;
  showLivingBadge?: boolean;
}

export function isUnknownDeathYear(value?: string | null): boolean {
  return value?.trim().toLowerCase() === UNKNOWN_DEATH_YEAR;
}

export function isLivingMarker(value?: string | null): boolean {
  return value?.trim().toLowerCase() === LIVING_MARKER;
}

export function lifeStatusFromStored(deathDate?: string | null): LifeStatus {
  const trimmed = deathDate?.trim();
  if (!trimmed) return 'unspecified';
  if (isLivingMarker(trimmed)) return 'alive';
  return 'deceased';
}

export function isLiving(deathDate?: string | null): boolean {
  return lifeStatusFromStored(deathDate) === 'alive';
}

export function deceasedYearFromStored(deathDate?: string | null): string {
  if (lifeStatusFromStored(deathDate) !== 'deceased') return '';
  if (isUnknownDeathYear(deathDate)) return '';
  return deathDate!.trim();
}

export function birthModeFromStored(birthDate?: string | null): BirthMode {
  if (!birthDate?.trim() || isUnknownDeathYear(birthDate)) return 'unknown';
  return 'year';
}

export function birthYearFromStored(birthDate?: string | null): string {
  return birthModeFromStored(birthDate) === 'year' ? (birthDate?.trim() ?? '') : '';
}

export function encodeBirthYear(mode: BirthMode, year: string): string | null {
  if (mode === 'unknown') return null;
  const trimmed = year.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Maps UI life status (+ optional death year when deceased) to stored deathDate. */
export function encodeLifeStatus(status: LifeStatus, deathYear: string): string | null {
  if (status === 'unspecified') return null;
  if (status === 'alive') return LIVING_MARKER;
  const trimmed = deathYear.trim();
  return trimmed.length > 0 ? trimmed : UNKNOWN_DEATH_YEAR;
}

export function formatBirthDisplay(birthDate?: string | null, birthDateApproximate?: boolean): string {
  if (birthModeFromStored(birthDate) === 'year') {
    const approx = birthDateApproximate ? ' (approx.)' : '';
    return `${birthDate!.trim()}${approx}`;
  }
  return 'Unknown';
}

export function formatLifeStatusDisplay(deathDate?: string | null): string {
  const status = lifeStatusFromStored(deathDate);
  if (status === 'unspecified') return 'Not recorded';
  if (status === 'alive') return 'Living';
  if (isUnknownDeathYear(deathDate)) return 'Deceased (year unknown)';
  return `Died ${deathDate!.trim()}`;
}

export function formatLifeDisplay(
  birthDate?: string,
  deathDate?: string,
  birthDateApproximate?: boolean,
): LifeDisplay {
  const lifeStatus = lifeStatusFromStored(deathDate);
  const birthMode = birthModeFromStored(birthDate);
  const approx = birthDateApproximate ? ' (approx.)' : '';
  const birthYear = birthMode === 'year' ? birthDate!.trim() : null;

  if (lifeStatus === 'unspecified') {
    if (birthYear) return { primary: `b. ${birthYear}${approx}` };
    return { primary: null };
  }

  if (lifeStatus === 'alive') {
    if (birthYear) return { primary: `b. ${birthYear}${approx}` };
    return { primary: null, showLivingBadge: true };
  }

  // Deceased
  const deathYear = isUnknownDeathYear(deathDate) ? null : deathDate!.trim();
  if (birthYear && deathYear) return { primary: `${birthYear}${approx} - ${deathYear}` };
  if (birthYear) return { primary: `${birthYear}${approx} - ?` };
  if (deathYear) return { primary: `d. ${deathYear}` };
  return { primary: 'Deceased' };
}

export function formatLifeYears(
  birthDate?: string,
  deathDate?: string,
  birthDateApproximate?: boolean,
): string | null {
  return formatLifeDisplay(birthDate, deathDate, birthDateApproximate).primary;
}

export function optionalField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
