import { EmptyState } from '../../ui/components'
import { ListIcon } from '../../ui/icons'

export function ListsPage() {
  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900">Liste</h1>
        <p className="text-sm text-stone-500">
          Liste multiple per spesa, film, valigie: spunte, assegnazione e sync in tempo reale.
        </p>
      </header>
      <EmptyState
        icon={<ListIcon className="h-8 w-8 text-stone-300" />}
        title="Arriva con la Fase 1"
        description="Le liste condivise sono il prossimo blocco di lavoro dello skeleton."
      />
    </div>
  )
}
