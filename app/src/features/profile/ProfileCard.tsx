import { useRef } from 'react'

import { Button, Card, ErrorBanner, Field, Select, TextInput } from '../../ui/components'
import { CheckIcon, ImageIcon } from '../../ui/icons'
import { useCouple } from '../coupling/CoupleProvider'
import type { ProfileState } from './useProfile'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Editable profile fields; the state lives in ProfilePage so the CycleCard
 *  can gate on the same `sex` value without a second fetch. */
export function ProfileCard({ profile }: { profile: ProfileState }) {
  const { refresh } = useCouple()
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const {
    displayName,
    setDisplayName,
    birthDate,
    setBirthDate,
    sex,
    setSex,
    avatarUrl,
    avatarBusy,
    loading,
    saving,
    saved,
    error,
    save,
    uploadAvatar,
    removeAvatar,
  } = profile

  async function handleSave() {
    if (await save()) await refresh()
  }

  async function handleAvatarPicked(file: File) {
    if (await uploadAvatar(file)) await refresh()
  }

  async function handleAvatarRemove() {
    if (!window.confirm('Rimuovere la foto profilo?')) return
    await removeAvatar()
    await refresh()
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Il tuo profilo
      </h2>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="La tua foto profilo"
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-line"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-100 text-lg font-bold text-accent-ink"
            >
              {initials(displayName) || '·'}
            </span>
          )}
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="secondary"
              disabled={avatarBusy || loading}
              onClick={() => avatarFileRef.current?.click()}
              className="px-3.5 py-2 text-xs"
            >
              <ImageIcon className="h-4 w-4" /> {avatarUrl ? 'Cambia foto' : 'Aggiungi foto'}
            </Button>
            {avatarUrl && (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => void handleAvatarRemove()}
                className="block text-xs text-ink-faint transition hover:text-red-500 disabled:opacity-50"
              >
                Rimuovi foto
              </button>
            )}
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(changeEvent) => {
              const file = changeEvent.target.files?.[0]
              changeEvent.target.value = ''
              if (file) void handleAvatarPicked(file)
            }}
          />
        </div>

        <Field label="Nome">
          <TextInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Come ti chiami"
            disabled={loading}
          />
        </Field>
        <Field label="Compleanno" hint="Di default è privato: lo useremo per i promemoria.">
          <TextInput
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field label="Sesso" hint="Mostra le sezioni pensate per te, come il ciclo.">
          <Select value={sex} onChange={(e) => setSex(e.target.value)} disabled={loading}>
            <option value="">Non indicato</option>
            <option value="male">Maschio</option>
            <option value="female">Femmina</option>
          </Select>
        </Field>
        <Button onClick={() => void handleSave()} loading={saving} className="w-full">
          {saved ? (
            <>
              <CheckIcon className="h-4 w-4" /> Salvato
            </>
          ) : (
            'Salva profilo'
          )}
        </Button>
      </div>
    </Card>
  )
}
