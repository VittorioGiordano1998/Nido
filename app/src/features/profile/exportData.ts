import { toDateKey } from '../../core/dates'
import { supabase } from '../../core/supabase'

/**
 * GDPR data export (TASK-GDPR-…-002): reads everything the signed-in account
 * can already see (RLS scopes every select — a partner's private rows stay
 * out), packs a JSON plus the referenced photos into a ZIP and downloads it.
 * Nothing is uploaded anywhere: the archive is built in the browser.
 *
 * JSZip is imported lazily, so normal loads never pay for it.
 */

/** Every couple-scoped table; `select *` is fine because RLS scopes rows. */
const TABLES = [
  'couples',
  'couple_members',
  'profiles',
  'events',
  'task_lists',
  'tasks',
  'task_attachments',
  'notes',
  'daily_answers',
  'decisions',
  'decision_votes',
  'wishlist_items',
  'partner_facts',
  'time_capsules',
  'week_plans',
  'nudges',
  'savings_projects',
  'loyalty_cards',
  'moods',
  'stickies',
  'memories',
  'cycle_logs',
  'cycle_shares',
] as const

const PAGE_SIZE = 1000

export interface ExportResult {
  fileName: string
  tableCounts: Record<string, number>
  photoCount: number
  photoNames: string[]
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

async function fetchAll(table: string): Promise<Array<Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Tabella ${table}: ${error.message}`)
    const page = (data ?? []) as Array<Record<string, unknown>>
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return rows
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

export async function exportAccountData(email: string | undefined): Promise<ExportResult> {
  const tables: Record<string, Array<Record<string, unknown>>> = {}
  for (const table of TABLES) {
    tables[table] = await fetchAll(table)
  }

  // Photo objects referenced by the rows that the account can see.
  const photoRefs: Array<{ bucket: string; path: string }> = []
  const addPhoto = (bucket: string, path: unknown) => {
    const value = asString(path)
    if (value && !isExternalUrl(value)) photoRefs.push({ bucket, path: value })
  }
  for (const row of tables.memories ?? []) addPhoto('memories', row.photo_path)
  for (const row of tables.task_attachments ?? []) {
    if (row.kind === 'photo') addPhoto('list-photos', row.value)
  }
  for (const row of tables.task_lists ?? []) addPhoto('list-photos', row.cover_path)
  for (const row of tables.couples ?? []) addPhoto('list-photos', row.hero_path)
  for (const row of tables.profiles ?? []) addPhoto('avatars', row.avatar_url)

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const folder = `nido-export-${toDateKey(new Date())}`
  const photosFolder = zip.folder(`${folder}/photos`)

  // Signed URLs per bucket, then one file per object; a failed URL is skipped
  // (the row stays in the JSON, so nothing is silently lost).
  const photoNames: string[] = []
  const byBucket = new Map<string, string[]>()
  for (const ref of photoRefs) {
    const list = byBucket.get(ref.bucket) ?? []
    list.push(ref.path)
    byBucket.set(ref.bucket, list)
  }
  for (const [bucket, paths] of byBucket) {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrls([...new Set(paths)], 60 * 30)
    if (signError) continue
    for (const entry of signed ?? []) {
      if (!entry.signedUrl || !entry.path) continue
      try {
        const response = await fetch(entry.signedUrl)
        if (!response.ok) continue
        const blob = await response.blob()
        const name = `${bucket}/${entry.path.split('/').pop() ?? 'foto'}`
        photosFolder?.file(name, blob)
        photoNames.push(name)
      } catch {
        // Best effort: the metadata export is the contract, the files follow.
      }
    }
  }

  const tableCounts: Record<string, number> = {}
  for (const table of TABLES) tableCounts[table] = tables[table]?.length ?? 0

  const payload = {
    app: 'Nido',
    exportedAt: new Date().toISOString(),
    account: { email: email ?? null },
    notes: [
      "Ogni tabella è quella visibile all'account esportante (RLS compresa).",
      'Le foto referenziate sono in photos/<bucket>/; una foto mancante era probabilmente già stata sostituita o rimossa.',
    ],
    tableCounts,
    tables,
    photos: photoNames,
  }

  zip.file(`${folder}/nido-export.json`, JSON.stringify(payload, null, 2))
  const blob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${folder}.zip`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 10_000)

  const fileName = `${folder}.zip`
  return { fileName, tableCounts, photoCount: photoNames.length, photoNames }
}
