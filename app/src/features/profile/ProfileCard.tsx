import { Button, Card, ErrorBanner, Field, TextInput } from '../../ui/components'
import { CheckIcon } from '../../ui/icons'
import { useCouple } from '../coupling/CoupleProvider'
import { useProfile } from './useProfile'

export function ProfileCard() {
  const { refresh } = useCouple()
  const {
    displayName,
    setDisplayName,
    birthDate,
    setBirthDate,
    loading,
    saving,
    saved,
    error,
    save,
  } = useProfile()

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
