import { EmptyState } from '../../ui/components'
import { HeartIcon } from '../../ui/icons'

export function UsPage() {
  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900">Noi</h1>
        <p className="text-sm text-stone-500">
          Domanda del giorno, decisioni alla cieca, wishlist, fatti sul partner e capsule del tempo.
        </p>
      </header>
      <EmptyState
        icon={<HeartIcon className="h-8 w-8 text-stone-300" />}
        title="Arriva con la Fase 2"
        description="Il cuore di Nido: piccoli rituali quotidiani da fare in due."
      />
    </div>
  )
}
