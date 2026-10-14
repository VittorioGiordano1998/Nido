import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDateIt } from '../../core/dates'
import { supabase } from '../../core/supabase'
import { Button, Card, ErrorBanner, Field, TextInput } from '../../ui/components'
import { CheckIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { SECTION_DEFS, useSettings } from '../settings/SettingsProvider'

export function ProfilePage() {
  const { session, signOut } = useAuth()
  const { couple, refresh } = useCouple()
  const { enabled, toggle } = useSettings()
  const userId = session?.user.id

  const [displayName, setDisplayName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    void (async () => {
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('display_name, birth_date')
        .eq('id', userId)
        .single()
      if (!active) return
      if (loadError) {
        setError(loadError.message)
      } else if (data) {
        setDisplayName((data.display_name as string | null) ?? '')
        setBirthDate((data.birth_date as string | null) ?? '')
      }
      setLoadingProfile(false)
    })()
    return () => {
      active = false
    }
  }, [userId])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setError(null)
    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || 'Senza nome',
        birth_date: birthDate || null,
      })
      .eq('id', userId)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
    await refresh()
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900">Profilo</h1>
        <p className="text-sm text-stone-500">I tuoi dati, la vostra coppia e le sezioni attive.</p>
      </header>

      {error && <ErrorBanner message={error} />}

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Il tuo profilo
        </h2>
        <div className="space-y-4">
          <Field label="Nome">
            <TextInput
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Come ti chiami"
              disabled={loadingProfile}
            />
          </Field>
          <Field label="Compleanno" hint="Di default è privato: lo useremo per i promemoria.">
            <TextInput
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={loadingProfile}
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

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          La vostra coppia
        </h2>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-stone-800">{couple?.name ?? 'Senza nome'}</p>
          {couple?.startedAt && (
            <p className="text-stone-500">Insieme dal {formatDateIt(couple.startedAt)}</p>
          )}
          <ul className="space-y-1 pt-1">
            {couple?.members.map((member) => (
              <li key={member.userId} className="flex items-center justify-between text-stone-600">
                <span>{member.displayName}</span>
                <span className="text-xs text-stone-400">
                  entrato il {formatDateIt(member.joinedAt.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
          {couple && couple.members.length < 2 && (
            <p className="pt-2 text-xs text-stone-500">
              Manca il partner:{' '}
              <Link to="/pair" className="font-semibold text-clay-700 hover:underline">
                condividi il codice invito
              </Link>
              .
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Sezioni attive
        </h2>
        <div className="space-y-4">
          {SECTION_DEFS.map((section) => (
            <div key={section.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-800">{section.label}</p>
                <p className="text-xs text-stone-500">{section.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled[section.key]}
                aria-label={`Attiva o disattiva ${section.label}`}
                onClick={() => toggle(section.key)}
                className={`h-6 w-11 shrink-0 rounded-full transition ${
                  enabled[section.key] ? 'bg-clay-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition ${
                    enabled[section.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
        Esci
      </Button>

      <p className="pb-2 text-center text-xs text-stone-400">
        Nido · M1 — {session?.user.email}
      </p>
    </div>
  )
}
