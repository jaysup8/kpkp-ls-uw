/**
 * POST /api/migrate
 * Accepts a JSON payload exported from the old localStorage-based system
 * and imports it into Turso DB. Existing rows are upserted (not deleted).
 */
import { ensureDb } from '@/lib/db'
import type { StockItem, DailyStockRecord, DailyPL } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const db = await ensureDb()
    const payload = await request.json()

    let itemsImported = 0
    let stockImported = 0
    let plImported = 0
    let notesImported = 0

    // Items
    const items: StockItem[] = payload['kpkp_items'] ?? []
    for (const item of items) {
      await db.execute({
        sql: `INSERT INTO items
          (id, name_th, name_en, unit, category, supplier, par_lasalle, par_udomsuk, cost_per_unit, active, auto_order, branches)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_th=excluded.name_th, name_en=excluded.name_en, unit=excluded.unit,
            category=excluded.category, supplier=excluded.supplier,
            par_lasalle=excluded.par_lasalle, par_udomsuk=excluded.par_udomsuk,
            cost_per_unit=excluded.cost_per_unit, active=excluded.active,
            auto_order=excluded.auto_order, branches=excluded.branches`,
        args: [
          item.id, item.nameTh, item.nameEn, item.unit, item.category, item.supplier,
          (item.parLevels?.lasalle ?? 0), (item.parLevels?.udomsuk ?? 0),
          item.costPerUnit ?? 0, item.active ? 1 : 0, item.autoOrder ? 1 : 0,
          item.branches ? JSON.stringify(item.branches) : null,
        ],
      })
      itemsImported++
    }

    // Stock records per branch
    for (const branch of ['lasalle', 'udomsuk'] as const) {
      const records: DailyStockRecord[] = payload[`kpkp_${branch}_stock`] ?? []
      for (const r of records) {
        await db.execute({
          sql: `INSERT INTO stock_records
            (id, date, branch, item_id, opening_stock, received, used, closing_stock, ordered, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, branch, item_id) DO UPDATE SET
              id=excluded.id,
              opening_stock=excluded.opening_stock, received=excluded.received,
              used=excluded.used, closing_stock=excluded.closing_stock,
              ordered=excluded.ordered, notes=excluded.notes`,
          args: [
            r.id, r.date, r.branch ?? branch, r.itemId,
            r.openingStock, r.received, r.used, r.closingStock,
            r.ordered ? 1 : 0, r.notes ?? null,
          ],
        })
        stockImported++
      }

      // Daily P&L
      const pls: DailyPL[] = payload[`kpkp_${branch}_pl`] ?? []
      for (const pl of pls) {
        await db.execute({
          sql: `INSERT INTO daily_pl
            (date, branch, target_revenue, cash_sales, transfer_total, lineman_sales,
             grab_sales, robinhood_sales, shopee_sales, fresh_market_expense,
             freshket_expense, makro_expense, franchisor_expense, other_expenses, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, branch) DO UPDATE SET
              target_revenue=excluded.target_revenue, cash_sales=excluded.cash_sales,
              transfer_total=excluded.transfer_total, lineman_sales=excluded.lineman_sales,
              grab_sales=excluded.grab_sales, robinhood_sales=excluded.robinhood_sales,
              shopee_sales=excluded.shopee_sales, fresh_market_expense=excluded.fresh_market_expense,
              freshket_expense=excluded.freshket_expense, makro_expense=excluded.makro_expense,
              franchisor_expense=excluded.franchisor_expense, other_expenses=excluded.other_expenses,
              notes=excluded.notes`,
          args: [
            pl.date, pl.branch ?? branch, pl.targetRevenue, pl.cashSales, pl.transferTotal,
            pl.linemanSales, pl.grabSales, pl.robinhoodSales, pl.shopeeSales,
            pl.freshMarketExpense ?? 0, pl.freshketExpense ?? 0,
            pl.makroExpense ?? 0, pl.franchisorExpense ?? 0,
            JSON.stringify(pl.otherExpenses ?? []),
            pl.notes ?? null,
          ],
        })
        plImported++
      }

      // Daily notes
      const notes: Record<string, string> = payload[`kpkp_${branch}_notes`] ?? {}
      for (const [date, note] of Object.entries(notes)) {
        if (note?.trim()) {
          await db.execute({
            sql: `INSERT INTO daily_notes (date, branch, note) VALUES (?, ?, ?)
                  ON CONFLICT(date, branch) DO UPDATE SET note=excluded.note`,
            args: [date, branch, note],
          })
          notesImported++
        }
      }
    }

    return Response.json({ ok: true, itemsImported, stockImported, plImported, notesImported })
  } catch (err) {
    console.error('[POST /api/migrate]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
