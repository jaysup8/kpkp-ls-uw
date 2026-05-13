import type { StockItem, DailyStockRecord, DailyPL, Branch } from './types'
import { INITIAL_ITEMS } from './initialData'

const KEY = {
  items: 'kpkp_items',
  branch: 'kpkp_branch',
  stockRecords: (b: Branch) => `kpkp_${b}_stock`,
  dailyPL: (b: Branch) => `kpkp_${b}_pl`,
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

// Branch
export function getSelectedBranch(): Branch | null {
  return get<Branch>(KEY.branch)
}

export function setSelectedBranch(branch: Branch): void {
  set(KEY.branch, branch)
}

function migrateItems(raw: any[]): StockItem[] {
  return raw.map(i => {
    if (!i.parLevels && typeof i.parLevel === 'number') {
      const { parLevel, ...rest } = i
      return { ...rest, parLevels: { lasalle: parLevel, udomsuk: parLevel } } as StockItem
    }
    return i as StockItem
  })
}

// Items (shared across branches)
export function getItems(): StockItem[] {
  const raw = get<any[]>(KEY.items)
  if (!raw) return INITIAL_ITEMS
  return migrateItems(raw)
}

export function saveItems(items: StockItem[]): void {
  set(KEY.items, items)
}

// Stock Records (per branch)
export function getStockRecords(branch: Branch, date?: string): DailyStockRecord[] {
  const all = get<DailyStockRecord[]>(KEY.stockRecords(branch)) ?? []
  return date ? all.filter(r => r.date === date) : all
}

export function saveAllStockRecords(branch: Branch, records: DailyStockRecord[]): void {
  if (records.length === 0) return
  const all = get<DailyStockRecord[]>(KEY.stockRecords(branch)) ?? []
  const dates = [...new Set(records.map(r => r.date))]
  const kept = all.filter(r => !dates.includes(r.date))
  set(KEY.stockRecords(branch), [...kept, ...records])
}

// Daily P&L (per branch)
export function getDailyPLs(branch: Branch): DailyPL[] {
  return get<DailyPL[]>(KEY.dailyPL(branch)) ?? []
}

export function getDailyPL(branch: Branch, date: string): DailyPL | null {
  return getDailyPLs(branch).find(p => p.date === date) ?? null
}

export function saveDailyPL(branch: Branch, pl: DailyPL): void {
  const all = getDailyPLs(branch)
  const idx = all.findIndex(p => p.date === pl.date)
  if (idx >= 0) {
    all[idx] = pl
  } else {
    all.push(pl)
  }
  set(KEY.dailyPL(branch), all)
}

// Helpers
export function calcMaeManee(pl: Pick<DailyPL, 'transferTotal' | 'grabSales' | 'robinhoodSales' | 'shopeeSales'>): number {
  return pl.transferTotal - pl.grabSales - pl.robinhoodSales - pl.shopeeSales
}

export function calcTotalRevenue(pl: Omit<DailyPL, 'date' | 'branch' | 'targetRevenue' | 'notes'>): number {
  const maeManee = calcMaeManee(pl)
  return pl.cashSales + maeManee + pl.linemanSales + pl.grabSales + pl.robinhoodSales + pl.shopeeSales
}
