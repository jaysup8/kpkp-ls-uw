'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSelectedBranch } from '@/lib/storage'
import { fetchItems, fetchStockRecords, saveStockRecords, fetchDailyNote, saveDailyNote } from '@/lib/api'
import { parseStockText } from '@/lib/parseStock'
import type { ParseResult } from '@/lib/parseStock'
import { generateOrderText } from '@/lib/orderText'
import type { StockItem, DailyStockRecord, Branch } from '@/lib/types'
import { BRANCH_NAMES } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Items where user inputs ต้องสั่งเพิ่ม directly (no closing stock concept)
// Items where user inputs ต้องสั่งเพิ่ม directly (no closing stock — ordered by piece/baht)
// r21 (หมึกกรอบ) and r22 (เส้นใหญ่) are kg items with closing stock, so excluded here
const ORDER_MODE_IDS = new Set(['r12', 'r13', 'r15', 'r16', 'r17', 'r18', 'r19', 'r20'])

type RowState = {
  itemId: string
  closingStock: number   // for normal items
  orderAmount: number    // ORDER_MODE: direct input; normal: manual override
  manualOrder: boolean   // normal items only — true when user has manually set To Order
  ordered: boolean       // user-checked: this item has already been ordered
}

const CATEGORIES = [
  { key: 'raw',        label: 'Raw Food',         supplier: '' },
  { key: 'freshket',   label: 'Freshket / Makro', supplier: 'Freshket / Makro' },
  { key: 'franchisor', label: 'Franchisor',        supplier: 'Franchisor' },
  { key: 'drinks',     label: 'Drinks',            supplier: '' },
  { key: 'etc',        label: 'ETC',               supplier: '' },
] as const

const BRANCH_BADGE: Record<Branch, string> = {
  lasalle:  'bg-blue-100 text-blue-700',
  udomsuk:  'bg-emerald-100 text-emerald-700',
}

type PasteStep = 'input' | 'recheck'

export default function DailyPage() {
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [date, setDate] = useState(today())
  const [items, setItems] = useState<StockItem[]>([])
  const [rows, setRows] = useState<RowState[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // monthlyOrderMap: itemId → total ต้องสั่งเพิ่ม for previous days in this month
  const [monthlyOrderMap, setMonthlyOrderMap] = useState<Record<string, number>>({})

  // Daily note (per branch+date) — saved separately
  const [note, setNote] = useState('')

  // Order text modal
  const [showOrderText, setShowOrderText] = useState(false)
  const [orderTextContent, setOrderTextContent] = useState('')
  const [copied, setCopied] = useState(false)

  // Paste modal
  const [showPaste, setShowPaste] = useState(false)
  const [pasteStep, setPasteStep] = useState<PasteStep>('input')
  const [pasteText, setPasteText] = useState('')
  const [parseResults, setParseResults] = useState<ParseResult[]>([])

  const loadData = useCallback(async (b: Branch, selectedDate: string) => {
    setLoading(true)
    try {
      const [allItemsRaw, todayRecords, allRecords, noteText] = await Promise.all([
        fetchItems(),
        fetchStockRecords(b, selectedDate),
        fetchStockRecords(b),
        fetchDailyNote(b, selectedDate),
      ])
      const allItems = allItemsRaw.filter(i => i.active && (!i.branches || i.branches.includes(b)))
      setItems(allItems)
      setRows(allItems.map(item => {
        const ex = todayRecords.find(r => r.itemId === item.id)
        const closing = ex?.closingStock ?? 0
        const usesAuto = item.autoOrder && !ORDER_MODE_IDS.has(item.id)
        return {
          itemId: item.id,
          closingStock: closing,
          orderAmount: usesAuto ? 0 : (ex?.received ?? 0),
          manualOrder: false,
          ordered: ex?.ordered ?? false,
        }
      }))
      const monthPrefix = selectedDate.slice(0, 7)
      const map: Record<string, number> = {}
      for (const r of allRecords) {
        if (r.date.startsWith(monthPrefix) && r.date !== selectedDate) {
          map[r.itemId] = (map[r.itemId] ?? 0) + r.received
        }
      }
      setMonthlyOrderMap(map)
      setNote(noteText)
      setSaved(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const b = getSelectedBranch()
    if (!b) { router.push('/'); return }
    setBranch(b)
    loadData(b, date)
  }, [date, router, loadData])

  function updateClosing(itemId: string, value: number) {
    setRows(prev => prev.map(r => {
      if (r.itemId !== itemId) return r
      // Updating closing stock clears any manual To Order override — formula takes over
      return { ...r, closingStock: value, manualOrder: false }
    }))
    setSaved(false)
  }

  function updateOrder(itemId: string, value: number) {
    setRows(prev => prev.map(r =>
      r.itemId === itemId ? { ...r, orderAmount: value, manualOrder: true } : r
    ))
    setSaved(false)
  }

  function toggleOrdered(itemId: string) {
    setRows(prev => prev.map(r =>
      r.itemId === itemId ? { ...r, ordered: !r.ordered } : r
    ))
    setSaved(false)
  }

  function updateNote(value: string) {
    setNote(value)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => {
      if (branch) saveDailyNote(branch, date, value).catch(console.error)
    }, 800)
  }

  // Compute the effective To Order for a row (same logic as render)
  function getDisplayOrder(r: RowState, item: StockItem): number {
    if (ORDER_MODE_IDS.has(r.itemId)) return r.orderAmount
    // If item is not configured for auto-formula, always use manual value
    if (!item?.autoOrder) return r.orderAmount
    const par = item.parLevels?.[branch!] ?? 0
    const auto = par > 0 ? Math.max(0, par - r.closingStock) : 0
    return r.manualOrder ? r.orderAmount : auto
  }

  async function handleSave() {
    if (!branch || saving) return
    setSaving(true)
    try {
      const iMap = Object.fromEntries(items.map(i => [i.id, i]))
      const records: DailyStockRecord[] = rows.map(r => {
        const item = iMap[r.itemId]
        const isOrderMode = ORDER_MODE_IDS.has(r.itemId)
        return {
          id: makeId(),
          date,
          branch,
          itemId: r.itemId,
          openingStock: 0,
          received: getDisplayOrder(r, item),
          used: 0,
          closingStock: isOrderMode ? 0 : r.closingStock,
          ordered: r.ordered,
        }
      })
      await saveStockRecords(records)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function handleGenerateOrderText() {
    if (!branch) return
    const iMap = Object.fromEntries(items.map(i => [i.id, i]))
    const orderMap: Record<string, number> = {}
    for (const row of rows) {
      const item = iMap[row.itemId]
      if (item) orderMap[row.itemId] = getDisplayOrder(row, item)
    }
    const text = generateOrderText(date, branch, orderMap)
    setOrderTextContent(text)
    setCopied(false)
    setShowOrderText(true)
  }

  function openPaste() {
    setPasteText('')
    setPasteStep('input')
    setParseResults([])
    setShowPaste(true)
  }

  function handleParse() {
    setParseResults(parseStockText(pasteText))
    setPasteStep('recheck')
  }

  function handleConfirm() {
    setRows(prev => {
      const next = [...prev]
      for (const r of parseResults) {
        if (r.itemId === null || r.closing === null) continue
        const idx = next.findIndex(row => row.itemId === r.itemId)
        if (idx === -1) continue
        if (ORDER_MODE_IDS.has(r.itemId)) {
          next[idx] = { ...next[idx], orderAmount: r.closing! }
        } else {
          next[idx] = { ...next[idx], closingStock: r.closing!, manualOrder: false }
        }
      }
      return next
    })
    setSaved(false)
    setShowPaste(false)
  }

  if (!branch) return null
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      กำลังโหลด...
    </div>
  )

  const itemMap = Object.fromEntries(items.map(i => [i.id, i]))

  const matched = parseResults.filter(r => r.itemId !== null && r.closing !== null)
  const noUpdate = parseResults.filter(r => r.itemId !== null && r.closing === null)
  const unmatched = parseResults.filter(r => r.itemId === null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">บันทึกสต็อกรายวัน</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BRANCH_BADGE[branch]}`}>
              {BRANCH_NAMES[branch]}
            </span>
          </div>
          <p className="text-xs text-slate-400">Daily Stock Entry</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateOrderText}
            className="border border-slate-300 bg-white text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            📝 <span className="hidden sm:inline">สร้างข้อความสั่งซื้อ</span><span className="sm:hidden">สั่งซื้อ</span>
          </button>
          <button
            onClick={openPaste}
            className="border border-slate-300 bg-white text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            📋 วางข้อความ
          </button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden sm:block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          {saved && !saving && <span className="hidden sm:inline text-green-600 text-sm font-medium">✓ บันทึกแล้ว</span>}
        </div>
      </div>

      {/* Mobile sticky save bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-lg">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
        </button>
        {saved && !saving && <span className="text-green-600 text-sm font-medium shrink-0">✓ บันทึกแล้ว</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-20 sm:pb-0">
        <div>

      {CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.category === cat.key)
        if (catItems.length === 0) return null
        return (
          <div key={cat.key} className="mb-8">
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{cat.label}</span>
              {cat.supplier && <span className="text-xs text-slate-400">{cat.supplier}</span>}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-600 min-w-[120px] sm:min-w-[160px]">รายการ</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-slate-600 w-16">หน่วย</th>
                    <th className="hidden sm:table-cell text-center px-4 py-3 font-medium text-slate-600 w-16">Par</th>
                    <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-600 w-24 sm:w-32">
                      คงเหลือ<br /><span className="font-normal opacity-60">Closing</span>
                    </th>
                    <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-600 w-24 sm:w-32">
                      สั่งเพิ่ม<br /><span className="font-normal opacity-60">To Order</span>
                    </th>
                    <th className="hidden sm:table-cell text-center px-4 py-3 font-medium text-slate-600 w-32">
                      ใช้ไป (เดือนนี้)<br /><span className="font-normal opacity-60">Monthly Used</span>
                    </th>
                    <th className="text-center px-2 py-2 sm:py-3 font-medium text-slate-600 w-10 sm:w-12" title="สั่งซื้อแล้ว">
                      ✓<br /><span className="font-normal opacity-60 text-[10px]">Done</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => {
                    const row = rows.find(r => r.itemId === item.id)
                    if (!row) return null
                    const isOrderMode = ORDER_MODE_IDS.has(item.id)
                    const usesAutoFormula = !isOrderMode && !!item.autoOrder
                    const par = item.parLevels?.[branch] ?? 0
                    // Compute To Order live from par - closing only when item is configured for auto.
                    // Items with autoOrder=false (or ORDER_MODE) always use the stored value.
                    const autoOrder = par > 0 ? Math.max(0, par - row.closingStock) : 0
                    const displayOrder = !usesAutoFormula
                      ? row.orderAmount
                      : (row.manualOrder ? row.orderAmount : autoOrder)
                    const monthlyUsed = (monthlyOrderMap[item.id] ?? 0) + displayOrder
                    const isLow = !isOrderMode && par > 0 && row.closingStock < par * 0.3
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${row.ordered ? 'bg-emerald-50/60' : isLow ? 'bg-red-50' : idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                          <div className="font-medium text-slate-800 text-sm">{item.nameTh}</div>
                          <div className="text-xs text-slate-400 hidden sm:block">{item.nameEn}</div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-2 text-slate-500 text-xs">{item.unit}</td>
                        <td className="hidden sm:table-cell px-4 py-2 text-center text-slate-500">{(item.parLevels?.[branch] ?? 0) || '—'}</td>

                        {/* คงเหลือ column */}
                        <td className="px-1 sm:px-2 py-1.5">
                          {isOrderMode ? (
                            <span className="block text-center text-slate-300 text-sm">—</span>
                          ) : (
                            <input
                              type="number"
                              value={row.closingStock || ''}
                              placeholder="0"
                              onChange={e => updateClosing(item.id, parseFloat(e.target.value) || 0)}
                              className={`w-full text-center border rounded-lg px-1 sm:px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${isLow ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                            />
                          )}
                        </td>

                        {/* ต้องสั่งเพิ่ม column */}
                        <td className="px-1 sm:px-2 py-1.5">
                          <input
                            type="number"
                            value={displayOrder || ''}
                            placeholder="0"
                            onChange={e => updateOrder(item.id, parseFloat(e.target.value) || 0)}
                            className={`w-full text-center border rounded-lg px-1 sm:px-2 py-2 text-sm focus:outline-none focus:ring-2 font-medium ${
                              isOrderMode
                                ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-400'
                                : 'border-slate-200 bg-white focus:ring-blue-400'
                            }`}
                          />
                        </td>

                        {/* ใช้ไป column — hidden on mobile */}
                        <td className="hidden sm:table-cell px-4 py-2 text-center">
                          <span className="font-semibold text-slate-700">{monthlyUsed || '—'}</span>
                          {isLow && <span className="ml-1 text-xs">⚠️</span>}
                        </td>

                        {/* Ordered checkbox */}
                        <td className="px-1 sm:px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.ordered}
                            onChange={() => toggleOrdered(item.id)}
                            className="w-5 h-5 accent-emerald-600 cursor-pointer"
                            title={row.ordered ? 'สั่งแล้ว' : 'ยังไม่ได้สั่ง'}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <div className="flex justify-end mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
      </div>
        </div>

        {/* Sticky notes panel — scrolls with the page */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-100/60">
              <span className="text-lg">📝</span>
              <h2 className="font-semibold text-amber-900 text-sm">โน้ตประจำวัน</h2>
              <span className="text-xs text-amber-600 ml-auto">บันทึกอัตโนมัติ</span>
            </div>
            <textarea
              value={note}
              onChange={e => updateNote(e.target.value)}
              placeholder="เขียนโน้ต / รายการสั่งซื้อพิเศษ / ปัญหาที่พบ ..."
              className="w-full h-[calc(100vh-12rem)] min-h-[400px] p-4 text-sm bg-amber-50 focus:outline-none resize-none placeholder-amber-300 text-amber-900"
            />
          </div>
        </aside>
      </div>

      {/* Order text modal */}
      {showOrderText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800 text-lg">📝 ข้อความสั่งซื้อวัตถุดิบ</h2>
              <button onClick={() => setShowOrderText(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="px-6 py-4">
              <textarea
                readOnly
                value={orderTextContent}
                className="w-full h-96 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono bg-slate-50 focus:outline-none resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowOrderText(false)} className="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                ปิด
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(orderTextContent)
                  setCopied(true)
                }}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste modal */}
      {showPaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">
                  {pasteStep === 'input' ? '📋 วางข้อความนับสต็อก' : '🔍 ตรวจสอบผลการอ่าน'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pasteStep === 'input'
                    ? 'วางข้อความในรูปแบบ "ชื่อสินค้า: ค่า" แล้วกด วิเคราะห์'
                    : `พบ ${matched.length} รายการ · ไม่อัปเดต ${noUpdate.length} · ไม่รู้จัก ${unmatched.length}`}
                </p>
              </div>
              <button onClick={() => setShowPaste(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {pasteStep === 'input' ? (
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={'มันหมู: 2\nหมูสับ: หมด\nสันคอหมู(หมูชิ้น): 1.5\nกุ้ง:\n...'}
                  className="w-full h-72 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  autoFocus
                />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 font-medium">ข้อความต้นฉบับ</th>
                      <th className="text-left py-2 font-medium">รายการที่จับคู่</th>
                      <th className="text-center py-2 font-medium w-24">คงเหลือ</th>
                      <th className="text-center py-2 font-medium w-20">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResults.map((r, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${r.itemId === null ? 'bg-amber-50' : ''}`}>
                        <td className="py-2 pr-3">
                          <span className="font-mono text-xs text-slate-600">{r.rawName}</span>
                          {r.rawValue && <span className="font-mono text-xs text-slate-400"> : {r.rawValue}</span>}
                        </td>
                        <td className="py-2 pr-3">
                          {r.matchedName
                            ? <span className="text-slate-800">{r.matchedName}</span>
                            : <span className="text-amber-600 text-xs">— ไม่รู้จัก</span>}
                        </td>
                        <td className="py-2 text-center">
                          {r.itemId === null ? (
                            <span className="text-slate-300">—</span>
                          ) : r.closing === null ? (
                            <span className="text-slate-400 text-xs">ไม่อัปเดต</span>
                          ) : r.closing === 0 ? (
                            <span className="font-bold text-red-600">หมด (0)</span>
                          ) : (
                            <span className="font-semibold text-slate-800">{r.closing}</span>
                          )}
                        </td>
                        <td className="py-2 text-center text-base">
                          {r.itemId === null ? '⚠️' : r.closing === null ? '—' : '✓'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              {pasteStep === 'input' ? (
                <>
                  <button onClick={() => setShowPaste(false)} className="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleParse}
                    disabled={!pasteText.trim()}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    วิเคราะห์
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setPasteStep('input')} className="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                    ← แก้ไขข้อความ
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={matched.length === 0}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    ยืนยันและกรอก ({matched.length} รายการ)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
