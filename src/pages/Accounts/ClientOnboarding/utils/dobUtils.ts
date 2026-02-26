export interface ParsedDob {
  iso: string | null;
  error: string | null;
}

const ISO_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const MDY_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const pad2 = (value: number) => value.toString().padStart(2, '0');

const buildIso = (year: number, month: number, day: number): ParsedDob => {
  if (year < 1900 || year > 9999) {
    return { iso: null, error: 'Use M/D/YYYY format' };
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { iso: null, error: 'Enter a valid date' };
  }

  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return { iso: null, error: 'Enter a valid date' };
  }

  return { iso: `${year}-${pad2(month)}-${pad2(day)}`, error: null };
};

export const parseDobInput = (rawValue: string | null | undefined): ParsedDob => {
  const value = (rawValue || '').trim();

  if (!value) {
    return { iso: null, error: null };
  }

  const isoMatch = value.match(ISO_REGEX);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return buildIso(year, month, day);
  }

  const mdyMatch = value.match(MDY_REGEX);
  if (mdyMatch) {
    const month = Number(mdyMatch[1]);
    const day = Number(mdyMatch[2]);
    const year = Number(mdyMatch[3]);
    return buildIso(year, month, day);
  }

  return { iso: null, error: 'Use M/D/YYYY format' };
};

export const normalizeDobToIso = (rawValue: string | null | undefined): string | null => {
  return parseDobInput(rawValue).iso;
};

export const formatDobForDisplay = (rawValue: string | null | undefined): string => {
  const parsed = parseDobInput(rawValue);
  if (!parsed.iso) {
    return (rawValue || '').trim();
  }

  const [year, month, day] = parsed.iso.split('-').map(Number);
  return `${month}/${day}/${year}`;
};
