/**
 * Realtime channel topics.
 *
 * supabase-js reuses an existing channel when `client.channel(topic)` is
 * called with the same topic: a second `.on()` lands on an already-subscribed
 * channel and throws ("cannot add postgres_changes callbacks ... after
 * subscribe()"), and React StrictMode's double mount hits the same reuse in
 * development because `removeChannel` is async.
 *
 * Every subscription therefore gets its own topic: never share a channel
 * between hooks or between two mounts.
 */
export function uniqueChannelTopic(prefix: string): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}-${id}`
}
