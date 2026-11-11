import { useMemo } from 'react'

import { formatDateIt, formatShortDateIt, toDateKey } from '../../core/dates'
import { useEvents } from '../calendar/useEvents'
import { useLists } from '../lists/useLists'
import { useMemories } from '../memories/useMemories'
import { notePreview, useNotes } from '../notes/useNotes'
import { useSettings } from '../settings/SettingsProvider'
import { US_FEATURES } from '../us/features'
import { useWishlist } from '../wishlist/useWishlist'
import { queryTokens, rankMatches } from './match'

/**
 * Global search (state layer, TASK-SEARCH-…-002): one query over what the
 * section hooks already load. Client-side only; the overlay mounts this hook
 * while it is open, so there is no subscription at rest.
 */

export type SearchKind = 'destination' | 'note' | 'list' | 'task' | 'event' | 'memory' | 'wish'

export interface SearchResult {
  id: string
  kind: SearchKind
  title: string
  subtitle: string
  to: string
  /** Router state the destination page understands (a day, a note id). */
  state?: unknown
}

export interface SearchGroup {
  key: string
  title: string
  results: SearchResult[]
}

const PER_GROUP = 5

const MAIN_DESTINATIONS = [
  { to: '/', title: 'Home', description: 'La vostra giornata', section: null },
  { to: '/calendar', title: 'Calendario', description: 'Eventi e ricorrenze', section: 'calendar' },
  { to: '/lists', title: 'Liste', description: 'Spesa, film, valigie', section: 'lists' },
  { to: '/notes', title: 'Note', description: 'Il blocchetto condiviso', section: null },
  { to: '/us', title: 'Noi', description: 'Rituali, ricordi e cose pratiche', section: 'us' },
  { to: '/profile', title: 'Profilo', description: 'Dati, tema e notifiche', section: null },
] as const

export function useGlobalSearch(query: string): { groups: SearchGroup[]; loading: boolean } {
  const { enabled } = useSettings()
  const notes = useNotes()
  const lists = useLists()
  const events = useEvents()
  const memories = useMemories()
  const wishlist = useWishlist()

  const destinations = useMemo<SearchResult[]>(() => {
    const main = MAIN_DESTINATIONS.filter(
      (entry) => entry.section === null || enabled[entry.section],
    ).map((entry) => ({
      id: `go:${entry.to}`,
      kind: 'destination' as const,
      title: entry.title,
      subtitle: entry.description,
      to: entry.to,
    }))
    const us = enabled.us
      ? US_FEATURES.map((feature) => ({
          id: `go:${feature.to}`,
          kind: 'destination' as const,
          title: feature.title,
          subtitle: feature.description,
          to: feature.to,
        }))
      : []
    return [...main, ...us]
  }, [enabled])

  const groups = useMemo<SearchGroup[]>(() => {
    const tokens = queryTokens(query)
    // Nothing typed yet: the overlay doubles as a quick "go to".
    if (tokens.length === 0) return [{ key: 'go', title: 'Vai a', results: destinations }]

    const result: SearchGroup[] = []
    const push = (key: string, title: string, results: SearchResult[]) => {
      if (results.length > 0) result.push({ key, title, results })
    }

    push(
      'go',
      'Vai a',
      rankMatches(
        destinations,
        tokens,
        (entry) => ({ title: entry.title, secondary: [entry.subtitle] }),
        PER_GROUP,
      ),
    )

    push(
      'notes',
      'Note',
      rankMatches(
        notes.notes,
        tokens,
        (note) => ({ title: note.title, secondary: [note.body] }),
        PER_GROUP,
      ).map((note) => ({
        id: `note:${note.id}`,
        kind: 'note',
        title: note.title.trim() || 'Senza titolo',
        subtitle: notePreview(note, 70),
        to: '/notes',
        state: { noteId: note.id },
      })),
    )

    if (enabled.lists) {
      const listTitle = new Map(lists.lists.map((list) => [list.id, list.title]))
      push('lists', 'Liste', [
        ...rankMatches(lists.lists, tokens, (list) => ({ title: list.title }), PER_GROUP).map(
          (list): SearchResult => ({
            id: `list:${list.id}`,
            kind: 'list',
            title: list.title,
            subtitle: 'Lista',
            to: `/lists/${list.id}`,
          }),
        ),
        ...rankMatches(lists.tasks, tokens, (task) => ({ title: task.title }), PER_GROUP).map(
          (task): SearchResult => ({
            id: `task:${task.id}`,
            kind: 'task',
            title: task.title,
            subtitle: `${listTitle.get(task.listId) ?? 'Lista'}${task.done ? ' · completata' : ''}`,
            to: `/lists/${task.listId}`,
          }),
        ),
      ])
    }

    if (enabled.calendar) {
      push(
        'events',
        'Eventi',
        rankMatches(
          events.events,
          tokens,
          (event) => ({ title: event.title, secondary: [event.location, event.description] }),
          PER_GROUP,
        ).map((event) => ({
          id: `event:${event.id}`,
          kind: 'event',
          title: event.title,
          subtitle: `${formatShortDateIt(event.startAt)}${event.rrule ? ' · si ripete' : ''}${
            event.location ? ` · ${event.location}` : ''
          }`,
          to: '/calendar',
          state: { dateKey: toDateKey(new Date(event.startAt)) },
        })),
      )
    }

    if (enabled.us) {
      push(
        'memories',
        'Ricordi',
        rankMatches(
          memories.memories,
          tokens,
          (memory) => ({ title: memory.caption }),
          PER_GROUP,
        ).map((memory) => ({
          id: `memory:${memory.id}`,
          kind: 'memory',
          title: memory.caption.trim() || 'Un ricordo',
          subtitle: formatDateIt(memory.takenOn),
          to: '/us/memories',
        })),
      )

      push(
        'wishlist',
        'Wishlist',
        rankMatches(
          wishlist.items,
          tokens,
          (item) => ({ title: item.title, secondary: [item.notes] }),
          PER_GROUP,
        ).map((item) => ({
          id: `wish:${item.id}`,
          kind: 'wish',
          title: item.title,
          subtitle: 'Desiderio',
          to: '/us/wishlist',
        })),
      )
    }

    return result
  }, [
    query,
    destinations,
    enabled,
    notes.notes,
    lists.lists,
    lists.tasks,
    events.events,
    memories.memories,
    wishlist.items,
  ])

  const loading =
    notes.loading || lists.loading || events.loading || memories.loading || wishlist.loading

  return { groups, loading }
}
