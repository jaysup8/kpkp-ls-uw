'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getItems, getStockRecords, saveAllStockRecords, getSelectedBranch } from '@/lib/storage'
import { parseStockText } from '@/lib/parseStock'
import type { ParseResult } from '@/lib/parseStock'
import type { StockItem, DailyStockRecord, Branch } from '@/lib/types'
import { BRANCH_NAMES } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

type RowState = {
  itemId: string
  closingStock: number  // คงเหลือ — the only user-input field
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
  // monthlyOrderMap: itemId → total ต้องสั่งเพิ่ม for previous days in this month
  const [monthlyOrderMap, setMonthlyOrderMap] = useState<Record<string, number>>({})

  // Paste modal
  const [showPaste, setShowPaste] = useState(false)
  const [pasteStep, setPasteStep] = useState<PasteStep>('input')
  const [pasteText, setPasteText] = useState('')
  const [parseResults, setParseResults] = useState<ParseResult[]>([])

  useEffect(() => {
    const b = getSelectedBranch()
    if (!b) { router.push('/'); return }
    setBranch(b)
    const allItems = getItems().filter(i => i.active)
    setItems(allItems)

    // Load today's saved values
    const todayRecords = getStockRecords(b, date)
    setRows(allItems.map(item => {
      const ex = todayRecords.find(r => r.itemId === item.id)
      return { itemId: item.id, closingStock: ex?.closingStock ?? 0 }
    }))

    // Build monthly sum of ต้องสั่งเพิ่ม (received) excluding today
    const monthPrefix = date.slice(0, 7)
    const allRecords = getStockRecords(b)
    const map: Record<string, number> = {}
    for (const r of allRecords) {
      if (r.date.startsWith(monthPrefix) && r.date !== date) {
        map[r.itemId] = (map[r.itemId] ?? 0) + r.received
      }
    }
    setMonthlyOrderMap(map)
    setSaved(false)
  }, [date, router])

  function updateRow(itemId: string, value: number) {
    setRows(prev => prev.map(r => r.itemId === itemId ? { ...r, closingStock: value } : r))
    setSaved(false)
  }

  function handleSave() {
    if (!branch) return
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]))
    const records: DailyStockRecord[] = rows.map(r => {
      const item = itemMap[r.itemId]
      const orderAmount = item?.parLevel > 0 ? Math.max(0, item.parLevel - r.closingStock) : 0
      return {
        id: makeId(),
        date,
        branch,
        itemId: r.itemId,
        openingStock: 0,
        received: orderAmount,  // stores ต้องสั่งเพิ่ม for monthly sum
        used: 0,
        closingStock: r.closingStock,
      }
    })
    saveAllStockRecords(branch, records)
    setSaved(true)
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
        if (idx !== -1) next[idx] = { ...next[idx], closingStock: r.closing! }
      }
      return next
    })
    setSaved(false)
    setShowPaste(false)
  }

  if (!branch) return null

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
        <div className="flex items-center gap-3">
          <button
            onClick={openPaste}
            className="border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            📋 วางข้อความ
          </button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm"
          />
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            บันทึก
          </button>
          {saved && <span className="text-green-600 text-sm font-medium">✓ บันทึกแล้ว</span>}
        </div>
      </div>

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
                    <th className="text-left px-4 py-3 font-medium text-slate-600 min-w-[160px]">รายการ</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-16">หน่วย</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-16">Par</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-32">
                      คงเหลือ<br /><span className="font-normal opacity-60">Closing Stock</span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-32">
                      ต้องสั่งเพิ่ม<br /><span className="font-normal opacity-60">To Order</span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-32">
                      ใช้ไป (เดือนนี้)<br /><span className="font-normal opacity-60">Monthly Used</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => {
                    const row = rows.find(r => r.itemId === item.id)
                    if (!row) return null
                    const orderAmount = item.parLevel > 0 ? Math.max(0, item.parLevel - row.closingStock) : 0
                    const monthlyUsed = (monthlyOrderMap[item.id] ?? 0) + orderAmount
                    const isLow = item.parLevel > 0 && row.closingStock < item.parLevel * 0.3
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${isLow ? 'bg-red-50' : idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-800">{item.nameTh}</div>
                          <div className="text-xs text-slate-400">{item.nameEn}</div>
                        </td>
                        <td className="px-4 py-2 text-slate-500 text-xs">{item.unit}</td>
                        <td className="px-4 py-2 text-center text-slate-500">{item.parLevel || '—'}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.closingStock || ''}
                            placeholder="0"
                            onChange={e => updateRow(item.id, parseFloat(e.target.value) || 0)}
                            className={`w-full text-center border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${isLow ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.parLevel > 0 ? (
                            <span className={`font-semibold ${orderAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              {orderAmount}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.parLevel > 0 ? (
                            <span className="font-semibold text-slate-700">
                              {monthlyUsed}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                          {isLow && <span className="ml-1 text-xs">⚠️</span>}
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
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          บันทึกทั้งหมด
        </button>
      </div>

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
