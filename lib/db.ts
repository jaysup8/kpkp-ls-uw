import { createClient } from '@libsql/client'
import { INITIAL_ITEMS } from './initialData'
import type { StockItem } from './types'

let _client: ReturnType<typeof createClient> | null = null

export function getDb() {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    if (!url) throw new Error('TURSO_DATABASE_URL is not set')
    _client = createClient({ url, authToken })
  }
  return _client
}

export async function initDb(): Promise<void> {
  const db = getDb()
  const stmts = [
    `CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name_th TEXT NOT NULL,
      name_en TEXT NOT NULL,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      supplier TEXT NOT NULL,
      par_lasalle REAL DEFAULT 0,
      par_udomsuk REAL DEFAULT 0,
      cost_per_unit REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      auto_order INTEGER DEFAULT 1,
      branches TEXT DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS stock_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      branch TEXT NOT NULL,
      item_id TEXT NOT NULL,
      opening_stock REAL DEFAULT 0,
      received REAL DEFAULT 0,
      used REAL DEFAULT 0,
      closing_stock REAL DEFAULT 0,
      ordered INTEGER DEFAULT 0,
      notes TEXT DEFAULT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date, branch, item_id)
    )`,
    `CREATE TABLE IF NOT EXISTS daily_pl (
      date TEXT NOT NULL,
      branch TEXT NOT NULL,
      target_revenue REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      transfer_total REAL DEFAULT 0,
      lineman_sales REAL DEFAULT 0,
      grab_sales REAL DEFAULT 0,
      robinhood_sales REAL DEFAULT 0,
      shopee_sales REAL DEFAULT 0,
      fresh_market_expense REAL DEFAULT 0,
      freshket_expense REAL DEFAULT 0,
      makro_expense REAL DEFAULT 0,
      franchisor_expense REAL DEFAULT 0,
      other_expenses TEXT DEFAULT '[]',
      notes TEXT DEFAULT NULL,
      PRIMARY KEY (date, branch)
    )`,
    `CREATE TABLE IF NOT EXISTS daily_notes (
      date TEXT NOT NULL,
      branch TEXT NOT NULL,
      note TEXT DEFAULT '',
      PRIMARY KEY (date, branch)
    )`,
  ]
  for (const sql of stmts) {
    await db.execute(sql)
  }

  // Seed initial items if table is empty
  const count = await db.execute('SELECT COUNT(*) as n FROM items')
  const n = Number((count.rows[0] as unknown as { n: number }).n)
  if (n === 0) {
    await seedItems(db, INITIAL_ITEMS)
  }
}

async function seedItems(db: ReturnType<typeof createClient>, items: StockItem[]) {
  for (const item of items) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO items
        (id, name_th, name_en, unit, category, supplier, par_lasalle, par_udomsuk, cost_per_unit, active, auto_order, branches)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        item.id,
        item.nameTh,
        item.nameEn,
        item.unit,
        item.category,
        item.supplier,
        item.parLevels.lasalle,
        item.parLevels.udomsuk,
        item.costPerUnit,
        item.active ? 1 : 0,
        item.autoOrder ? 1 : 0,
        item.branches ? JSON.stringify(item.branches) : null,
      ],
    })
  }
}

let _initialized = false

export async function ensureDb(): Promise<ReturnType<typeof getDb>> {
  if (!_initialized) {
    await initDb()
    _initialized = true
  }
  return getDb()
}
