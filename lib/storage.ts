import type { StockItem, DailyStockRecord, DailyPL, Branch } from './types'
import { INITIAL_ITEMS } from './initialData'

const KEY = {
  items: 'kpkp_items',
  branch: 'kpkp_branch',
  stockRecords: (b: Branch) => `kpkp_${b}_stock`,
  dailyPL: (b: Branch) => `kpkp_${b}_pl`,
  dailyNotes: (b: Branch) => `kpkp_${b}_notes`,
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
    let next = i
    // parLevel → parLevels
    if (!next.parLevels && typeof next.parLevel === 'number') {
      const { parLevel, ...rest } = next
      next = { ...rest, parLevels: { lasalle: parLevel, udomsuk: parLevel } }
    }
    // autoOrder default: raw → true, others → false
    if (next.autoOrder === undefined) {
      next = { ...next, autoOrder: next.category === 'raw' }
    }
    return next as StockItem
  })
}

// Items (shared across branches)
export function getItems(): StockItem[] {
  const raw = get<any[]>(KEY.items)
  if (!raw) return INITIAL_ITEMS

  // Step 1: migrate parLevel → parLevels
  let stored = migrateItems(raw)

  // Step 2: if a stored item has the same Thai name as an INITIAL_ITEMS entry but
  // a different id (e.g. manually added before the canonical item was defined),
  // reassign it to the canonical id AND restore the canonical branches restriction
  // so branch-specific items (e.g. หมึกกรอบ → udomsuk only) stay correct.
  const canonicalByName = new Map(INITIAL_ITEMS.map(i => [i.nameTh, i]))
  const canonicalIdSet  = new Set(INITIAL_ITEMS.map(i => i.id))
  stored = stored.map(s => {
    const canonical = canonicalByName.get(s.nameTh)
    if (canonical && s.id !== canonical.id && !canonicalIdSet.has(s.id)) {
      return {
        ...s,
        id: canonical.id,
        // Restore branch restriction from canonical definition
        ...(canonical.branches ? { branches: canonical.branches } : {}),
      }
    }
    return s
  })

  // Step 3: deduplicate by id — keep the first occurrence (user's settings win)
  const seen = new Set<string>()
  stored = stored.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true })

  // Step 4: append any INITIAL_ITEMS that are still missing
  const storedIds = new Set(stored.map(i => i.id))
  const missing = INITIAL_ITEMS.filter(i => !storedIds.has(i.id))
  return missing.length > 0 ? [...stored, ...missing] : stored
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

// Daily notes (per branch + date)
export function getDailyNote(branch: Branch, date: string): string {
  const notes = get<Record<string, string>>(KEY.dailyNotes(branch)) ?? {}
  return notes[date] ?? ''
}

export function saveDailyNote(branch: Branch, date: string, note: string): void {
  const notes = get<Record<string, string>>(KEY.dailyNotes(branch)) ?? {}
  if (note.trim()) notes[date] = note
  else delete notes[date]
  set(KEY.dailyNotes(branch), notes)
}

// Helpers
export function calcMaeManee(pl: Pick<DailyPL, 'transferTotal' | 'grabSales' | 'robinhoodSales' | 'shopeeSales'>): number {
  return pl.transferTotal - pl.grabSales - pl.robinhoodSales - pl.shopeeSales
}

export function calcTotalRevenue(pl: Omit<DailyPL, 'date' | 'branch' | 'targetRevenue' | 'notes'>): number {
  const maeManee = calcMaeManee(pl)
  return pl.cashSales + maeManee + pl.linemanSales + pl.grabSales + pl.robinhoodSales + pl.shopeeSales
}

export function calcTotalExpenses(pl: Pick<DailyPL, 'freshMarketExpense' | 'freshketExpense' | 'makroExpense' | 'franchisorExpense' | 'otherExpenses'>): number {
  const others = (pl.otherExpenses ?? []).reduce((s, e) => s + (e.amount || 0), 0)
  return (pl.freshMarketExpense ?? 0)
       + (pl.freshketExpense ?? 0)
       + (pl.makroExpense ?? 0)
       + (pl.franchisorExpense ?? 0)
       + others
}

export function calcNetProfit(pl: DailyPL): number {
  return calcTotalRevenue(pl) - calcTotalExpenses(pl)
}
