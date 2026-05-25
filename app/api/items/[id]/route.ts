import { ensureDb } from '@/lib/db'
import type { InValue } from '@libsql/client'
import type { StockItem } from '@/lib/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await ensureDb()
    const patch: Partial<StockItem> = await request.json()

    const sets: string[] = []
    const args: InValue[] = []

    if (patch.nameTh !== undefined)       { sets.push('name_th=?');       args.push(patch.nameTh) }
    if (patch.nameEn !== undefined)       { sets.push('name_en=?');       args.push(patch.nameEn) }
    if (patch.unit !== undefined)         { sets.push('unit=?');           args.push(patch.unit) }
    if (patch.category !== undefined)     { sets.push('category=?');       args.push(patch.category) }
    if (patch.supplier !== undefined)     { sets.push('supplier=?');       args.push(patch.supplier) }
    if (patch.parLevels !== undefined) {
      sets.push('par_lasalle=?'); args.push(patch.parLevels.lasalle)
      sets.push('par_udomsuk=?'); args.push(patch.parLevels.udomsuk)
    }
    if (patch.costPerUnit !== undefined)  { sets.push('cost_per_unit=?'); args.push(patch.costPerUnit) }
    if (patch.active !== undefined)       { sets.push('active=?');         args.push(patch.active ? 1 : 0) }
    if (patch.autoOrder !== undefined)    { sets.push('auto_order=?');     args.push(patch.autoOrder ? 1 : 0) }
    if (patch.sortOrder !== undefined)    { sets.push('sort_order=?');     args.push(patch.sortOrder) }
    if ('branches' in patch) {
      sets.push('branches=?')
      args.push(patch.branches ? JSON.stringify(patch.branches) : null)
    }

    if (sets.length === 0) return Response.json({ ok: true })

    args.push(id)
    await db.execute({ sql: `UPDATE items SET ${sets.join(',')} WHERE id=?`, args })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/items/:id]', err)
    return Response.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await ensureDb()
    await db.execute({ sql: 'DELETE FROM items WHERE id=?', args: [id] })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/items/:id]', err)
    return Response.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
