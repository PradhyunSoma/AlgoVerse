import { afterEach, expect, test, vi } from 'vitest'
import { generateRandomArray, MAX_ARRAY_LENGTH, parseArrayInput } from './arrayValidation'

afterEach(() => vi.restoreAllMocks())

test.each([
  ['45, 12, 78, 23, 9, 56', [45, 12, 78, 23, 9, 56]],
  [' -99, +99, 0, -0, -2, -2 ', [-99, 99, 0, 0, -2, -2]],
  [' 7 ', [7]],
  [Array.from({ length: 12 }, (_, index) => index).join(','), Array.from({ length: 12 }, (_, index) => index)],
])('accepts valid integers in %s', (text, values) => {
  expect(parseArrayInput(text)).toEqual({ ok: true, values })
})

test.each(['', '   ', '1,,2', '1,', ',1', '1 2', '1.2', '2.0', '1e1', '0x10', 'NaN', 'Infinity', 'abc', '100', '-100', '9007199254740993', Array(13).fill(1).join(',')])('rejects invalid input %j', (text) => {
  const result = parseArrayInput(text)
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error.length).toBeGreaterThan(0)
})

test('random arrays cover both bounds and always satisfy custom-input validation', () => {
  const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValueOnce(1 - Number.EPSILON)
  expect(generateRandomArray(3)).toEqual([-99, 0, 99])
  random.mockRestore()
  for (let length = 1; length <= MAX_ARRAY_LENGTH; length += 1) {
    const values = generateRandomArray(length)
    expect(values).toHaveLength(length)
    expect(parseArrayInput(values.join(','))).toEqual({ ok: true, values })
  }
  expect(generateRandomArray()).toHaveLength(6)
})

test.each([0, 13, -1, 1.5, NaN])('rejects invalid random lengths %s', (length) => {
  expect(() => generateRandomArray(length)).toThrow(RangeError)
})
