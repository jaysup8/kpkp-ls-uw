import { ensureDb } from '@/lib/db'
import type { StockItem } from '@/lib/types'

function rowToItem(row: Record<string, unknown>): StockItem {
  return {
    id: row.id as string,
    nameTh: row.name_th as string,
    nameEn: row.name_en as string,
    unit: row.unit as string,
    category: row.category as StockItem['category'],
    supplier: row.supplier as string,
    parLevels: {
      lasalle: Number(row.par_lasalle ?? 0),
      udomsuk: Number(row.par_udomsuk ?? 0),
    },
    costPerUnit: Number(row.cost_per_unit ?? 0),
    active: Boolean(Number(row.active ?? 1)),
    autoOrder: Boolean(Number(row.auto_order ?? 1)),
    sortOrder: Number(row.sort_order ?? 0),
    ...(row.branches ? { branches: JSON.parse(row.branches as string) } : {}),
  }
}

export async function GET() {
  try {
    const db = await ensureDb()
    const result = await db.execute('SELECT * FROM items ORDER BY category, sort_order, id')
    const items = result.rows.map(r => rowToItem(r as Record<string, unknown>))
    return Response.json(items)
  } catch (err) {
    console.error('[GET /api/items]', err)
    return Response.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await ensureDb()
    const body = await request.json()
    const items: StockItem[] = Array.isArray(body) ? body : [body]

    for (const item of items) {
      await db.execute({
        sql: `INSERT INTO items
          (id, name_th, name_en, unit, category, supplier, par_lasalle, par_udomsuk, cost_per_unit, active, auto_order, branches, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_th=excluded.name_th, name_en=excluded.name_en, unit=excluded.unit,
            category=excluded.category, supplier=excluded.supplier,
            par_lasalle=excluded.par_lasalle, par_udomsuk=excluded.par_udomsuk,
            cost_per_unit=excluded.cost_per_unit, active=excluded.active,
            auto_order=excluded.auto_order, branches=excluded.branches,
            sort_order=excluded.sort_order`,
        args: [
          item.id, item.nameTh, item.nameEn, item.unit, item.category, item.supplier,
          item.parLevels.lasalle, item.parLevels.udomsuk, item.costPerUnit,
          item.active ? 1 : 0, item.autoOrder ? 1 : 0,
          item.branches ? JSON.stringify(item.branches) : null,
          item.sortOrder ?? 0,
        ],
      })
    }
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/items]', err)
    return Response.json({ error: 'Failed to save items' }, { status: 500 })
  }
}
