import { ensureDb } from '@/lib/db'
import type { DailyPL } from '@/lib/types'

function rowToPL(row: Record<string, unknown>): DailyPL {
  return {
    date: row.date as string,
    branch: row.branch as DailyPL['branch'],
    targetRevenue: Number(row.target_revenue ?? 0),
    cashSales: Number(row.cash_sales ?? 0),
    transferTotal: Number(row.transfer_total ?? 0),
    linemanSales: Number(row.lineman_sales ?? 0),
    grabSales: Number(row.grab_sales ?? 0),
    robinhoodSales: Number(row.robinhood_sales ?? 0),
    shopeeSales: Number(row.shopee_sales ?? 0),
    freshMarketExpense: Number(row.fresh_market_expense ?? 0),
    freshketExpense: Number(row.freshket_expense ?? 0),
    makroExpense: Number(row.makro_expense ?? 0),
    franchisorExpense: Number(row.franchisor_expense ?? 0),
    otherExpenses: row.other_expenses ? JSON.parse(row.other_expenses as string) : [],
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
      ? 'SELECT * FROM daily_pl WHERE branch=? AND date=?'
      : 'SELECT * FROM daily_pl WHERE branch=? ORDER BY date DESC'
    const args = date ? [branch, date] : [branch]

    const result = await db.execute({ sql, args })
    const pls = result.rows.map(r => rowToPL(r as Record<string, unknown>))
    return Response.json(date ? (pls[0] ?? null) : pls)
  } catch (err) {
    console.error('[GET /api/pl]', err)
    return Response.json({ error: 'Failed to fetch P&L' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await ensureDb()
    const pl: DailyPL = await request.json()

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
        pl.date, pl.branch, pl.targetRevenue, pl.cashSales, pl.transferTotal,
        pl.linemanSales, pl.grabSales, pl.robinhoodSales, pl.shopeeSales,
        pl.freshMarketExpense ?? 0, pl.freshketExpense ?? 0,
        pl.makroExpense ?? 0, pl.franchisorExpense ?? 0,
        JSON.stringify(pl.otherExpenses ?? []),
        pl.notes ?? null,
      ],
    })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/pl]', err)
    return Response.json({ error: 'Failed to save P&L' }, { status: 500 })
  }
}
