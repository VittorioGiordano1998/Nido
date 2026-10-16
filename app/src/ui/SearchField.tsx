import { CloseIcon } from './icons'
import { TextInput } from './components'

/**
 * Shared section filter (TASK-SEARCH-…-001): a small text field with a clear
 * button. Pure view: the page owns the state and the filtering.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="relative">
      <TextInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="px-3 py-2 pr-9 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Cancella la ricerca"
          className="absolute inset-y-0 right-1 my-auto flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition hover:bg-surface-soft hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
