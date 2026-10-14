import { useCallback, useEffect, useMemo, useState } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

export interface TaskList {
  id: string
  coupleId: string
  title: string
  position: number
  createdBy: string
  createdAt: string
}

export interface Task {
  id: string
  listId: string
  coupleId: string
  title: string
  done: boolean
  doneBy: string | null
  doneAt: string | null
  assignedTo: string | null
  position: number
  createdBy: string
  updatedAt: string
}

interface ListRow {
  id: string
  couple_id: string
  title: string
  position: number
  created_by: string
  created_at: string
}

interface TaskRow {
  id: string
  list_id: string
  couple_id: string
  title: string
  done: boolean
  done_by: string | null
  done_at: string | null
  assigned_to: string | null
  position: number
  created_by: string
  updated_at: string
}

const LIST_COLUMNS = 'id, couple_id, title, position, created_by, created_at'
const TASK_COLUMNS =
  'id, list_id, couple_id, title, done, done_by, done_at, assigned_to, position, created_by, updated_at'

function listRowToList(row: ListRow): TaskList {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    position: row.position,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function taskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    listId: row.list_id,
    coupleId: row.couple_id,
    title: row.title,
    done: row.done,
    doneBy: row.done_by,
    doneAt: row.done_at,
    assignedTo: row.assigned_to,
    position: row.position,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function hasId(value: unknown): value is { id: string } {
  return typeof asRecord(value).id === 'string'
}

function upsertList(lists: TaskList[], next: TaskList): TaskList[] {
  return [...lists.filter((list) => list.id !== next.id), next].sort(
    (a, b) => a.position - b.position,
  )
}

function upsertTask(tasks: Task[], next: Task): Task[] {
  return [...tasks.filter((task) => task.id !== next.id), next].sort(
    (a, b) => a.position - b.position,
  )
}

/**
 * Liste e attività della coppia (state layer): caricamento, scritture e
 * sincronizzazione Realtime su `task_lists` e `tasks` con un solo canale.
 */
export function useLists() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [lists, setLists] = useState<TaskList[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setLists([])
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [listsResult, tasksResult] = await Promise.all([
      supabase
        .from('task_lists')
        .select(LIST_COLUMNS)
        .eq('couple_id', coupleId)
        .order('position', { ascending: true }),
      supabase
        .from('tasks')
        .select(TASK_COLUMNS)
        .eq('couple_id', coupleId)
        .order('position', { ascending: true }),
    ])
    if (listsResult.error || tasksResult.error) {
      setError(
        (listsResult.error ?? tasksResult.error)?.message ?? 'Errore di caricamento delle liste.',
      )
    } else {
      setLists(((listsResult.data ?? []) as unknown as ListRow[]).map(listRowToList))
      setTasks(((tasksResult.data ?? []) as unknown as TaskRow[]).map(taskRowToTask))
      setError(null)
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(`lists-${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_lists', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setLists((current) => current.filter((list) => list.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            const row = payload.new as unknown as ListRow
            setLists((current) => upsertList(current, listRowToList(row)))
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setTasks((current) => current.filter((task) => task.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            const row = payload.new as unknown as TaskRow
            setTasks((current) => upsertTask(current, taskRowToTask(row)))
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const createList = useCallback(
    async (title: string) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const position = lists.reduce((max, list) => Math.max(max, list.position), 0) + 1
      const { data, error: insertError } = await supabase
        .from('task_lists')
        .insert({ couple_id: coupleId, created_by: userId, title, position })
        .select(LIST_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setLists((current) => upsertList(current, listRowToList(data as unknown as ListRow)))
    },
    [coupleId, userId, lists],
  )

  const renameList = useCallback(async (id: string, title: string) => {
    const { data, error: updateError } = await supabase
      .from('task_lists')
      .update({ title })
      .eq('id', id)
      .select(LIST_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setLists((current) => upsertList(current, listRowToList(data as unknown as ListRow)))
  }, [])

  const deleteList = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('task_lists').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setLists((current) => current.filter((list) => list.id !== id))
    setTasks((current) => current.filter((task) => task.listId !== id))
  }, [])

  const addTask = useCallback(
    async (listId: string, title: string) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const position =
        tasks
          .filter((task) => task.listId === listId)
          .reduce((max, task) => Math.max(max, task.position), 0) + 1
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({ list_id: listId, couple_id: coupleId, created_by: userId, title, position })
        .select(TASK_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setTasks((current) => upsertTask(current, taskRowToTask(data as unknown as TaskRow)))
    },
    [coupleId, userId, tasks],
  )

  const toggleTask = useCallback(async (id: string, done: boolean, doneBy: string) => {
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({
        done,
        done_by: done ? doneBy : null,
        done_at: done ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select(TASK_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setTasks((current) => upsertTask(current, taskRowToTask(data as unknown as TaskRow)))
  }, [])

  const setTaskAssignee = useCallback(async (id: string, assignedTo: string | null) => {
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({ assigned_to: assignedTo })
      .eq('id', id)
      .select(TASK_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setTasks((current) => upsertTask(current, taskRowToTask(data as unknown as TaskRow)))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setTasks((current) => current.filter((task) => task.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      lists,
      tasks,
      loading,
      error,
      refresh,
      createList,
      renameList,
      deleteList,
      addTask,
      toggleTask,
      setTaskAssignee,
      deleteTask,
    }),
    [
      lists,
      tasks,
      loading,
      error,
      refresh,
      createList,
      renameList,
      deleteList,
      addTask,
      toggleTask,
      setTaskAssignee,
      deleteTask,
    ],
  )
  return value
}

export interface OpenTask extends Task {
  listTitle: string
}

/** Le prime attività aperte (con il nome della lista): per Home e riepiloghi. */
export function useOpenTasks(limit = 3) {
  const data = useLists()
  const openTasks = useMemo<OpenTask[]>(() => {
    const orderByList = new Map(data.lists.map((list, index) => [list.id, index]))
    return data.tasks
      .filter((task) => !task.done)
      .sort(
        (a, b) =>
          (orderByList.get(a.listId) ?? 0) - (orderByList.get(b.listId) ?? 0) ||
          a.position - b.position,
      )
      .slice(0, limit)
      .map((task) => ({
        ...task,
        listTitle: data.lists.find((list) => list.id === task.listId)?.title ?? '',
      }))
  }, [data.lists, data.tasks, limit])
  return { ...data, openTasks }
}
