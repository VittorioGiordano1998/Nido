import { Button, Card, ErrorBanner, Field, Select, TextInput } from '../../ui/components'
import { CheckIcon } from '../../ui/icons'
import { useCouple } from '../coupling/CoupleProvider'
import type { ProfileState } from './useProfile'

/** Editable profile fields; the state lives in ProfilePage so the CycleCard
 *  can gate on the same `sex` value without a second fetch. */
export function ProfileCard({ profile }: { profile: ProfileState }) {
  const { refresh } = useCouple()
  const {
    displayName,
    setDisplayName,
    birthDate,
    setBirthDate,
    sex,
    setSex,
    loading,
    saving,
    saved,
    error,
    save,
  } = profile

  async function handleSave() {
    if (await save()) await refresh()
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Il tuo profilo
      </h2>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
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
