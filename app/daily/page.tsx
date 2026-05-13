'use client'
import { useEffect, useState } from 'react'
import { getItems, getStockRecords, saveAllStockRecords } from '@/lib/storage'
import type { StockItem, DailyStockRecord } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

type RowState = {
  itemId: string
  openingStock: number
  received: number
  used: number
  notes: string
}

const CATEGORIES = [
  { key: 'raw',        label: 'Raw Food',         supplier: '' },
  { key: 'freshket',   label: 'Freshket / Makro', supplier: 'Freshket / Makro' },
  { key: 'franchisor', label: 'Franchisor',        supplier: 'Franchisor' },
  { key: 'drinks',     label: 'Drinks',            supplier: '' },
  { key: 'etc',        label: 'ETC',               supplier: '' },
] as const

export default function DailyPage() {
  const [date, setDate] = useState(today())
  const [items, setItems] = useState<StockItem[]>([])
  const [rows, setRows] = useState<RowState[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const allItems = getItems().filter(i => i.active)
    setItems(allItems)
    const existing = getStockRecords(date)
    setRows(
      allItems.map(item => {
        const ex = existing.find(r => r.itemId === item.id)
        return {
          itemId: item.id,
          openingStock: ex?.openingStock ?? 0,
          received: ex?.received ?? 0,
          used: ex?.used ?? 0,
          notes: ex?.notes ?? '',
        }
      })
    )
    setSaved(false)
  }, [date])

  function updateRow(itemId: string, field: keyof RowState, value: number | string) {
    setRows(prev => prev.map(r => (r.itemId === itemId ? { ...r, [field]: value } : r)))
    setSaved(false)
  }

  function handleSave() {
    const records: DailyStockRecord[] = rows.map(r => ({
      id: makeId(),
      date,
      itemId: r.itemId,
      openingStock: r.openingStock,
      received: r.received,
      used: r.used,
      closingStock: r.openingStock + r.received - r.used,
      notes: r.notes,
    }))
    saveAllStockRecords(records)
    setSaved(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">บันทึกสต็อกรายวัน</h1>
          <p className="text-xs text-slate-500">Daily Stock Entry</p>
        </div>
        <div className="flex items-center gap-3">
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
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {cat.supplier}
              </span>
              {cat.label}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 min-w-[160px]">รายการ</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-16">หน่วย</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-16">Par</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-28">
                      ยกมา
                      <br />
                      <span className="font-normal opacity-60">Opening</span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-28">
                      รับเข้า
                      <br />
                      <span className="font-normal opacity-60">Received</span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-28">
                      ใช้ไป
                      <br />
                      <span className="font-normal opacity-60">Used</span>
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-28">
                      คงเหลือ
                      <br />
                      <span className="font-normal opacity-60">Closing</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => {
                    const row = rows.find(r => r.itemId === item.id)
                    if (!row) return null
                    const closing = row.openingStock + row.received - row.used
                    const isLow = closing < item.parLevel * 0.3 && item.parLevel > 0
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'} ${isLow ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-800">{item.nameTh}</div>
                          <div className="text-xs text-slate-400">{item.nameEn}</div>
                        </td>
                        <td className="px-4 py-2 text-slate-500 text-xs">{item.unit}</td>
                        <td className="px-4 py-2 text-center text-slate-500">{item.parLevel}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.openingStock || ''}
                            placeholder="0"
                            onChange={e =>
                              updateRow(item.id, 'openingStock', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.received || ''}
                            placeholder="0"
                            onChange={e =>
                              updateRow(item.id, 'received', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.used || ''}
                            placeholder="0"
                            onChange={e =>
                              updateRow(item.id, 'used', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`font-semibold ${isLow ? 'text-red-600' : 'text-slate-700'}`}
                          >
                            {closing % 1 === 0 ? closing : closing.toFixed(2)}
                          </span>
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
    </div>
  )
}
