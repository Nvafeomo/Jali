/** Stored in Neo4j when a year is explicitly marked unknown (not the same as blank). */
export const UNKNOWN_YEAR = 'unknown';

export type DeathStatus = 'living' | 'unknown' | 'year';
export type BirthMode = 'unknown' | 'year';

export interface LifeDisplay {
  /** Main date line under the name on tree nodes. */
  primary: string | null;
  /** Shown when death is blank (= living) and there is no birth year line. */
  showLivingBadge?: boolean;
}

export function isUnknownMarker(value?: string | null): boolean {
  return value?.trim().toLowerCase() === UNKNOWN_YEAR;
}

export function isLiving(deathDate?: string | null): boolean {
  const trimmed = deathDate?.trim();
  return !trimmed;
}

export function deathStatusFromStored(deathDate?: string | null): DeathStatus {
  if (isLiving(deathDate)) return 'living';
  if (isUnknownMarker(deathDate)) return 'unknown';
  return 'year';
}

export function deathYearFromStored(deathDate?: string | null): string {
  return deathStatusFromStored(deathDate) === 'year' ? (deathDate?.trim() ?? '') : '';
}

export function birthModeFromStored(birthDate?: string | null): BirthMode {
  if (!birthDate?.trim() || isUnknownMarker(birthDate)) return 'unknown';
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

export function encodeDeathYear(status: DeathStatus, year: string): string | null {
  if (status === 'living') return null;
  if (status === 'unknown') return UNKNOWN_YEAR;
  const trimmed = year.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formatBirthDisplay(birthDate?: string | null, birthDateApproximate?: boolean): string {
  if (birthModeFromStored(birthDate) === 'year') {
    const approx = birthDateApproximate ? ' (approx.)' : '';
    return `${birthDate!.trim()}${approx}`;
  }
  return 'Unknown';
}

export function formatDeathDisplay(deathDate?: string | null): string {
  const status = deathStatusFromStored(deathDate);
  if (status === 'living') return 'Living';
  if (status === 'unknown') return 'Unknown';
  return deathDate!.trim();
}

export function formatLifeDisplay(
  birthDate?: string,
  deathDate?: string,
  birthDateApproximate?: boolean,
): LifeDisplay {
  const birthMode = birthModeFromStored(birthDate);
  const deathStatus = deathStatusFromStored(deathDate);
  const approx = birthDateApproximate ? ' (approx.)' : '';
  const birthYear = birthMode === 'year' ? birthDate!.trim() : null;
  const deathYear = deathStatus === 'year' ? deathDate!.trim() : null;

  if (deathStatus === 'living') {
    if (birthYear) {
      return { primary: `${birthYear}${approx} –` };
    }
    return { primary: null, showLivingBadge: true };
  }

  if (deathStatus === 'unknown') {
    if (birthYear) return { primary: `${birthYear}${approx} – ?` };
    return { primary: 'Death unknown' };
  }

  // Deceased with known death year
  if (birthYear) return { primary: `${birthYear}${approx} – ${deathYear}` };
  return { primary: `d. ${deathYear}` };
}

/** @deprecated use formatLifeDisplay — kept for simple string callers */
export function formatLifeYears(
  birthDate?: string,
  deathDate?: string,
  birthDateApproximate?: boolean,
): string | null {
  return formatLifeDisplay(birthDate, deathDate, birthDateApproximate).primary;
}

/** Trim generic optional text fields (not vital years). */
export function optionalField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
