import type { StockItem, DailyStockRecord, DailyPL } from './types'
import { INITIAL_ITEMS } from './initialData'

const KEYS = {
  items: 'kpkp_items',
  stockRecords: 'kpkp_stock_records',
  dailyPL: 'kpkp_daily_pl',
}

function get<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const val = localStorage.getItem(key)
  return val ? JSON.parse(val) : null
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function getItems(): StockItem[] {
  return get<StockItem[]>(KEYS.items) ?? INITIAL_ITEMS
}

export function saveItems(items: StockItem[]): void {
  set(KEYS.items, items)
}

export function getStockRecords(date?: string): DailyStockRecord[] {
  const all = get<DailyStockRecord[]>(KEYS.stockRecords) ?? []
  return date ? all.filter(r => r.date === date) : all
}

export function saveAllStockRecords(records: DailyStockRecord[]): void {
  const all = get<DailyStockRecord[]>(KEYS.stockRecords) ?? []
  if (records.length > 0) {
    const dates = [...new Set(records.map(r => r.date))]
    const kept = all.filter(r => !dates.includes(r.date))
    set(KEYS.stockRecords, [...kept, ...records])
  }
}

export function getDailyPLs(): DailyPL[] {
  return get<DailyPL[]>(KEYS.dailyPL) ?? []
}

export function getDailyPL(date: string): DailyPL | null {
  return getDailyPLs().find(p => p.date === date) ?? null
}

export function saveDailyPL(pl: DailyPL): void {
  const all = getDailyPLs()
  const idx = all.findIndex(p => p.date === pl.date)
  if (idx >= 0) {
    all[idx] = pl
  } else {
    all.push(pl)
  }
  set(KEYS.dailyPL, all)
}
