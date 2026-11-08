export const MIN_ARRAY_LENGTH = 1
export const MAX_ARRAY_LENGTH = 12
export const MIN_ARRAY_VALUE = -99
export const MAX_ARRAY_VALUE = 99
export const DEFAULT_RANDOM_LENGTH = 6

export type ArrayInputResult =
  | { ok: true; values: number[] }
  | { ok: false; error: string }

export function parseArrayInput(text: string): ArrayInputResult {
  if (!text.trim()) return { ok: false, error: 'Enter at least one integer, separated by commas.' }
  const entries = text.split(',').map((entry) => entry.trim())
  if (entries.length > MAX_ARRAY_LENGTH) {
    return { ok: false, error: `Use at most ${MAX_ARRAY_LENGTH} values so each step stays readable.` }
  }
  const values: number[] = []
  for (const [index, entry] of entries.entries()) {
    if (!/^[+-]?\d+$/.test(entry)) {
      return { ok: false, error: `Value ${index + 1} must be an integer. Separate values with commas and leave no empty entries.` }
    }
    const value = Number(entry)
    if (!Number.isSafeInteger(value) || value < MIN_ARRAY_VALUE || value > MAX_ARRAY_VALUE) {
      return { ok: false, error: `Value ${index + 1} must be between ${MIN_ARRAY_VALUE} and ${MAX_ARRAY_VALUE}.` }
    }
    values.push(value === 0 ? 0 : value)
  }
  return { ok: true, values }
}

export function generateRandomArray(length = DEFAULT_RANDOM_LENGTH): number[] {
  if (!Number.isInteger(length) || length < MIN_ARRAY_LENGTH || length > MAX_ARRAY_LENGTH) {
    throw new RangeError(`Array length must be between ${MIN_ARRAY_LENGTH} and ${MAX_ARRAY_LENGTH}.`)
  }
  return Array.from({ length }, () =>
    Math.floor(Math.random() * (MAX_ARRAY_VALUE - MIN_ARRAY_VALUE + 1)) + MIN_ARRAY_VALUE,
  )
}
