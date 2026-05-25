import { ensureDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const db = await ensureDb()
    const url = new URL(request.url)
    const branch = url.searchParams.get('branch')
    const date = url.searchParams.get('date')
    if (!branch || !date) return Response.json({ error: 'branch and date required' }, { status: 400 })

    const result = await db.execute({
      sql: 'SELECT note FROM daily_notes WHERE branch=? AND date=?',
      args: [branch, date],
    })
    const row = result.rows[0] as unknown as { note: string } | undefined
    return Response.json({ note: row?.note ?? '' })
  } catch (err) {
    console.error('[GET /api/notes]', err)
    return Response.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await ensureDb()
    const { branch, date, note } = await request.json()
    if (!branch || !date) return Response.json({ error: 'branch and date required' }, { status: 400 })

    if (note?.trim()) {
      await db.execute({
        sql: `INSERT INTO daily_notes (date, branch, note) VALUES (?, ?, ?)
              ON CONFLICT(date, branch) DO UPDATE SET note=excluded.note`,
        args: [date, branch, note],
      })
    } else {
      await db.execute({
        sql: 'DELETE FROM daily_notes WHERE date=? AND branch=?',
        args: [date, branch],
      })
    }
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/notes]', err)
    return Response.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
