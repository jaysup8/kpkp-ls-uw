import { ensureDb } from '@/lib/db'
import type { DailyStockRecord } from '@/lib/types'

function rowToRecord(row: Record<string, unknown>): DailyStockRecord {
  return {
    id: row.id as string,
    date: row.date as string,
    branch: row.branch as DailyStockRecord['branch'],
    itemId: row.item_id as string,
    openingStock: Number(row.opening_stock ?? 0),
    received: Number(row.received ?? 0),
    used: Number(row.used ?? 0),
    closingStock: Number(row.closing_stock ?? 0),
    ordered: Boolean(Number(row.ordered ?? 0)),
    notes: (row.notes as string) ?? undefined,
  }
}

export async function GET(request: Request) {
  try {
    const db = await ensureDb()
    const url = new URL(request.url)
    const branch = url.searchParams.get('branch')
    const date = url.searchParams.get('date')

    if (!branch) return Response.json({ error: 'branch required' }, { status: 400 })

    const sql = date
      ? 'SELECT * FROM stock_records WHERE branch=? AND date=?'
      : 'SELECT * FROM stock_records WHERE branch=? ORDER BY date DESC'
    const args = date ? [branch, date] : [branch]

    const result = await db.execute({ sql, args })
    return Response.json(result.rows.map(r => rowToRecord(r as Record<string, unknown>)))
  } catch (err) {
    console.error('[GET /api/stock]', err)
    return Response.json({ error: 'Failed to fetch stock records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await ensureDb()
    const records: DailyStockRecord[] = await request.json()

    for (const r of records) {
      await db.execute({
        sql: `INSERT INTO stock_records
          (id, date, branch, item_id, opening_stock, received, used, closing_stock, ordered, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(date, branch, item_id) DO UPDATE SET
            id=excluded.id,
            opening_stock=excluded.opening_stock, received=excluded.received,
            used=excluded.used, closing_stock=excluded.closing_stock,
            ordered=excluded.ordered, notes=excluded.notes,
            updated_at=datetime('now')`,
        args: [
          r.id, r.date, r.branch, r.itemId,
          r.openingStock, r.received, r.used, r.closingStock,
          r.ordered ? 1 : 0, r.notes ?? null,
        ],
      })
    }
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/stock]', err)
    return Response.json({ error: 'Failed to save stock records' }, { status: 500 })
  }
}
