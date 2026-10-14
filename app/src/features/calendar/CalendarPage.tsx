import { EmptyState } from '../../ui/components'
import { CalendarIcon } from '../../ui/icons'

export function CalendarPage() {
  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900">Calendario</h1>
        <p className="text-sm text-stone-500">
          Eventi condivisi, tutto il giorno, ricorrenze e visibilità per la coppia o privata.
        </p>
      </header>
      <EmptyState
        icon={<CalendarIcon className="h-8 w-8 text-stone-300" />}
        title="Arriva con la Fase 1"
        description="Stiamo costruendo il calendario condiviso: lo schema è già pronto nel backend."
      />
    </div>
  )
}
