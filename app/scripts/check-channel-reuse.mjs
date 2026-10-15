// Verifica del meccanismo: due channel() con lo stesso topic riusano il canale
// (e .on() dopo subscribe() esplode); con un topic unico non c'è riuso.
import { createClient } from '@supabase/supabase-js'

const client = createClient('https://example.supabase.co', 'anon-key-for-test')
const handler = () => {}

const first = client
  .channel('events-demo')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handler)
first.subscribe()

const reused = client.channel('events-demo')
try {
  reused.on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handler)
  console.log('reused channel: .on() did NOT throw')
} catch (error) {
  console.log('reused channel throws:', error.message)
}

const unique = client.channel(`events-demo-${crypto.randomUUID()}`)
try {
  unique.on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handler)
  console.log('unique topic: .on() ok')
} catch (error) {
  console.log('unique topic throws:', error.message)
}

process.exit(0)
