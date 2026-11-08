import { useState, type FormEvent } from 'react'
import {
  DEFAULT_RANDOM_LENGTH, MAX_ARRAY_LENGTH, MAX_ARRAY_VALUE, MIN_ARRAY_VALUE,
  generateRandomArray, parseArrayInput,
} from './arrayValidation'

interface ArrayInputProps {
  initialValues: readonly number[]
  onApply: (values: readonly number[]) => void
  onPause: () => void
}

export default function ArrayInput({ initialValues, onApply, onPause }: ArrayInputProps) {
  const [draft, setDraft] = useState(initialValues.join(', '))
  const [randomLength, setRandomLength] = useState(DEFAULT_RANDOM_LENGTH)
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onPause()
    const result = parseArrayInput(draft)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    onApply(result.values)
  }

  function randomize() {
    const values = generateRandomArray(randomLength)
    setDraft(values.join(', '))
    setError('')
    onApply(values)
  }

  return (
    <section className="array-input-panel lesson-panel" aria-labelledby="array-input-title">
      <h2 id="array-input-title">Choose your array</h2>
      <form onSubmit={submit} className="array-input-form" noValidate>
        <label htmlFor="custom-array">Comma-separated integers</label>
        <div className="array-input-row">
          <input id="custom-array" type="text" value={draft} spellCheck={false}
            aria-invalid={Boolean(error)} aria-describedby={`array-input-help${error ? ' array-input-error' : ''}`}
            onChange={(event) => { setDraft(event.target.value); setError('') }} />
          <button className="step-button" type="submit">Apply Array</button>
        </div>
        <p id="array-input-help">Use 1–{MAX_ARRAY_LENGTH} integers from {MIN_ARRAY_VALUE} to {MAX_ARRAY_VALUE}. Duplicates and zero are welcome.</p>
        {error && <p id="array-input-error" className="input-error" role="alert">{error} The current array is preserved and playback is paused.</p>}
      </form>
      <div className="random-array-controls">
        <label htmlFor="random-length">Random array length</label>
        <select id="random-length" value={randomLength} onChange={(event) => setRandomLength(Number(event.target.value))}>
          {Array.from({ length: MAX_ARRAY_LENGTH }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
        <button className="step-button" type="button" onClick={randomize}>Generate Random Array</button>
      </div>
    </section>
  )
}
