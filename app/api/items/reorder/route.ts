import { ensureDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const db = await ensureDb()
    const updates: { id: string; sort_order: number }[] = await request.json()

    for (const { id, sort_order } of updates) {
      await db.execute({
        sql: 'UPDATE items SET sort_order=? WHERE id=?',
        args: [sort_order, id],
      })
    }
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/items/reorder]', err)
    return Response.json({ error: 'Failed to save order' }, { status: 500 })
  }
}
