/**
 * lib/api.ts — async client functions for all cloud data operations.
 * Replaces the synchronous localStorage functions from lib/storage.ts.
 * Branch selection (UI preference) still uses localStorage via lib/storage.ts.
 */
import type { StockItem, DailyStockRecord, DailyPL, Branch } from './types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `API error ${res.status}: ${path}`)
  }
  return res.json()
}

// ─── Items ───────────────────────────────────────────────────────────────────

export async function fetchItems(): Promise<StockItem[]> {
  return apiFetch<StockItem[]>('/api/items')
}

export async function saveItems(items: StockItem[]): Promise<void> {
  await apiFetch('/api/items', { method: 'POST', body: JSON.stringify(items) })
}

export async function patchItem(id: string, patch: Partial<StockItem>): Promise<void> {
  await apiFetch(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
}

export async function reorderItems(updates: { id: string; sort_order: number }[]): Promise<void> {
  if (updates.length === 0) return
  await apiFetch('/api/items/reorder', { method: 'POST', body: JSON.stringify(updates) })
}

// ─── Stock Records ────────────────────────────────────────────────────────────

export async function fetchStockRecords(branch: Branch, date?: string): Promise<DailyStockRecord[]> {
  const qs = date ? `?branch=${branch}&date=${date}` : `?branch=${branch}`
  return apiFetch<DailyStockRecord[]>(`/api/stock${qs}`)
}

export async function saveStockRecords(records: DailyStockRecord[]): Promise<void> {
  if (records.length === 0) return
  await apiFetch('/api/stock', { method: 'POST', body: JSON.stringify(records) })
}

// ─── Daily P&L ───────────────────────────────────────────────────────────────

export async function fetchDailyPLs(branch: Branch): Promise<DailyPL[]> {
  return apiFetch<DailyPL[]>(`/api/pl?branch=${branch}`)
}

export async function fetchDailyPL(branch: Branch, date: string): Promise<DailyPL | null> {
  return apiFetch<DailyPL | null>(`/api/pl?branch=${branch}&date=${date}`)
}

export async function saveDailyPL(pl: DailyPL): Promise<void> {
  await apiFetch('/api/pl', { method: 'POST', body: JSON.stringify(pl) })
}

// ─── Daily Notes ─────────────────────────────────────────────────────────────

export async function fetchDailyNote(branch: Branch, date: string): Promise<string> {
  const data = await apiFetch<{ note: string }>(`/api/notes?branch=${branch}&date=${date}`)
  return data.note ?? ''
}

export async function saveDailyNote(branch: Branch, date: string, note: string): Promise<void> {
  await apiFetch('/api/notes', { method: 'POST', body: JSON.stringify({ branch, date, note }) })
}

// ─── Migration ───────────────────────────────────────────────────────────────

export async function migrateLocalStorage(data: Record<string, unknown>) {
  return apiFetch<{ ok: boolean; itemsImported: number; stockImported: number; plImported: number; notesImported: number }>(
    '/api/migrate', { method: 'POST', body: JSON.stringify(data) }
  )
}
