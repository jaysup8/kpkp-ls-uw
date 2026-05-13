'use client'
import { useEffect, useState } from 'react'
import { getItems, saveItems } from '@/lib/storage'
import type { StockItem, Category } from '@/lib/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'fresh', label: 'วัตถุดิบสด (Fresh)' },
  { value: 'franchisor', label: 'แฟรนไชส์ (Franchisor)' },
  { value: 'dry', label: 'ของแห้ง / อื่นๆ (Dry Goods)' },
]

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const BLANK: Omit<StockItem, 'id'> = {
  nameTh: '',
  nameEn: '',
  unit: 'kg',
  category: 'fresh',
  supplier: 'Makro / Freshket',
  parLevel: 0,
  costPerUnit: 0,
  active: true,
}

export default function ItemsPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setItems(getItems())
  }, [])

  function persist(updated: StockItem[]) {
    setItems(updated)
    saveItems(updated)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function handleSave(item: StockItem) {
    const updated = items.find(i => i.id === item.id)
      ? items.map(i => (i.id === item.id ? item : i))
      : [...items, item]
    persist(updated)
    setEditing(null)
    showToast('บันทึกแล้ว ✓')
  }

  function handleToggle(id: string) {
    persist(items.map(i => (i.id === id ? { ...i, active: !i.active } : i)))
  }

  function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    persist(items.filter(i => i.id !== id))
    showToast('ลบแล้ว')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการรายการสินค้า</h1>
          <p className="text-xs text-slate-500">Stock Items Management</p>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-green-600 text-sm font-medium">{toast}</span>}
          <button
            onClick={() => setEditing({ id: makeId(), ...BLANK })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + เพิ่มรายการ
          </button>
        </div>
      </div>

      {editing && (
        <ItemForm
          item={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.category === cat.value)
        return (
          <div key={cat.value} className="mb-8">
            <h2 className="font-semibold text-slate-700 mb-3">
              {cat.label}{' '}
              <span className="text-slate-400 font-normal text-sm">({catItems.length} รายการ)</span>
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">ชื่อ</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">หน่วย</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Par Level</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">ราคา/หน่วย</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">ผู้จัดส่ง</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">สถานะ</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'} ${!item.active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-800">{item.nameTh}</div>
                        <div className="text-xs text-slate-400">{item.nameEn}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{item.unit}</td>
                      <td className="px-4 py-2.5 text-right">{item.parLevel}</td>
                      <td className="px-4 py-2.5 text-right">฿{item.costPerUnit}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{item.supplier}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleToggle(item.id)}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${item.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {item.active ? 'ใช้งาน' : 'ปิด'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setEditing(item)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {catItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        ไม่มีรายการ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: StockItem
  onSave: (i: StockItem) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(item)

  function update(field: keyof StockItem, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
      <h3 className="font-semibold text-blue-800 mb-4">
        {item.nameTh ? `แก้ไข: ${item.nameTh}` : 'เพิ่มรายการใหม่'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">ชื่อไทย *</label>
          <input
            value={form.nameTh}
            onChange={e => update('nameTh', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="หมูบด"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">ชื่ออังกฤษ</label>
          <input
            value={form.nameEn}
            onChange={e => update('nameEn', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ground Pork"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">หน่วย</label>
          <input
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="kg, pack, bottle"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">หมวดหมู่</label>
          <select
            value={form.category}
            onChange={e => update('category', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">ผู้จัดส่ง</label>
          <input
            value={form.supplier}
            onChange={e => update('supplier', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">
            Par Level (ปริมาณมาตรฐาน/วัน)
          </label>
          <input
            type="number"
            value={form.parLevel || ''}
            onChange={e => update('parLevel', parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">ราคา/หน่วย (฿)</label>
          <input
            type="number"
            value={form.costPerUnit || ''}
            onChange={e => update('costPerUnit', parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => onSave(form)}
          disabled={!form.nameTh}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          บันทึก
        </button>
        <button
          onClick={onCancel}
          className="border border-slate-300 px-5 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
