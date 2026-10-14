/**
 * Mostrata quando mancano le variabili Supabase: spiega esattamente cosa creare
 * senza lasciare l'utente davanti a una pagina bianca.
 */
export function SetupScreen() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-clay-600">Nido</p>
        <h1 className="text-2xl font-bold text-stone-900">Manca la configurazione</h1>
        <p className="text-sm text-stone-600">
          Crea il file <code className="rounded bg-stone-200 px-1.5 py-0.5 text-xs">app/.env.local</code>{' '}
          copiando <code className="rounded bg-stone-200 px-1.5 py-0.5 text-xs">.env.example</code> e
          incolla i valori del progetto Supabase (Settings &rarr; API).
        </p>
      </div>
      <pre className="overflow-x-auto rounded-2xl bg-stone-900 p-4 text-xs leading-relaxed text-stone-100">
        {`VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>`}
      </pre>
      <p className="text-xs text-stone-500">
        Dopo la modifica riavvia <code className="rounded bg-stone-200 px-1.5 py-0.5">npm run dev</code>.
      </p>
    </div>
  )
}
