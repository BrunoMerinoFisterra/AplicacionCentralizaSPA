// Utilidades compartidas de formularios (en FSTrack estaban duplicadas inline en cada pantalla).

const isEmptyValue = (value: unknown) =>
  value === null || value === undefined || value === '';

const isEmptyObject = (value: unknown) =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;

// Elimina recursivamente null/undefined/'' y objetos vacíos del payload.
export function cleanObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanObject)
      .filter((item) => item !== null && item !== undefined && !isEmptyObject(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const cleanedEntries = Object.entries(obj as Record<string, unknown>)
      .filter(([, value]) => !isEmptyValue(value))
      .map(([key, value]) => [key, cleanObject(value)] as const);
    return Object.fromEntries(
      cleanedEntries.filter(
        ([, value]) => value !== null && value !== undefined && !isEmptyObject(value)
      )
    );
  }
  return obj;
}

export function toNumberOrNull(value: string): number | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
