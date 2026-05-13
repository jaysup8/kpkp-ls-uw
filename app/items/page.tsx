'use client'
import { useEffect, useState } from 'react'
import { getItems, saveItems } from '@/lib/storage'
import type { StockItem, Category } from '@/lib/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'raw',        label: 'Raw Food' },
  { value: 'freshket',   label: 'Freshket / Makro' },
  { value: 'franchisor', label: 'Franchisor' },
  { value: 'drinks',     label: 'Drinks' },
  { value: 'etc',        label: 'ETC' },
]

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const BLANK: Omit<StockItem, 'id'> = {
  nameTh: '',
  nameEn: '',
  unit: 'kg',
  category: 'raw',
  supplier: '-',
  parLevel: 0,
  costPerUnit: 0,
  active: true,
}

export default function ItemsPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StockItem | null>(null)
  const [newItem, setNewItem] = useState<StockItem | null>(null)
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

  function startEdit(item: StockItem) {
    setEditingId(item.id)
    setEditForm({ ...item })
    setNewItem(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  function handleSave() {
    if (!editForm) return
    const updated = items.find(i => i.id === editForm.id)
      ? items.map(i => (i.id === editForm.id ? editForm : i))
      : [...items, editForm]
    persist(updated)
    setEditingId(null)
    setEditForm(null)
    showToast('บันทึกแล้ว ✓')
  }

  function handleSaveNew() {
    if (!newItem || !newItem.nameTh) return
    persist([...items, newItem])
    setNewItem(null)
    showToast('เพิ่มรายการแล้ว ✓')
  }

  function handleToggle(id: string) {
    persist(items.map(i => (i.id === id ? { ...i, active: !i.active } : i)))
  }

  function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    if (editingId === id) cancelEdit()
    persist(items.filter(i => i.id !== id))
    showToast('ลบแล้ว')
  }

  function updateForm(field: keyof StockItem, value: string | number | boolean) {
    setEditForm(f => f ? { ...f, [field]: value } : f)
  }

  function updateNew(field: keyof StockItem, value: string | number | boolean) {
    setNewItem(f => f ? { ...f, [field]: value } : f)
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
            onClick={() => { setNewItem({ id: makeId(), ...BLANK }); setEditingId(null) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + เพิ่มรายการ
          </button>
        </div>
      </div>

      {CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.category === cat.value)
        const showNewHere = newItem?.category === cat.value

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
                    <th className="text-left px-4 py-3 font-medium text-slate-600 min-w-[160px]">ชื่อ</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-20">หน่วย</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 w-24">Par Level</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 w-24">ราคา/หน่วย</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">ผู้จัดส่ง</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 w-20">สถานะ</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => (
                    <>
                      {/* Normal row */}
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${editingId === item.id ? 'bg-blue-50' : idx % 2 === 0 ? '' : 'bg-slate-50/50'} ${!item.active ? 'opacity-50' : ''}`}
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
                              onClick={() => editingId === item.id ? cancelEdit() : startEdit(item)}
                              className={`text-xs font-medium ${editingId === item.id ? 'text-slate-500 hover:underline' : 'text-blue-600 hover:underline'}`}
                            >
                              {editingId === item.id ? 'ยกเลิก' : 'แก้ไข'}
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

                      {/* Inline edit form — appears below this row */}
                      {editingId === item.id && editForm && (
                        <tr key={`edit-${item.id}`} className="border-b border-blue-200 bg-blue-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Field label="ชื่อไทย *">
                                <input
                                  value={editForm.nameTh}
                                  onChange={e => updateForm('nameTh', e.target.value)}
                                  className={INPUT}
                                  placeholder="หมูบด"
                                />
                              </Field>
                              <Field label="ชื่ออังกฤษ">
                                <input
                                  value={editForm.nameEn}
                                  onChange={e => updateForm('nameEn', e.target.value)}
                                  className={INPUT}
                                  placeholder="Minced Pork"
                                />
                              </Field>
                              <Field label="หน่วย">
                                <input
                                  value={editForm.unit}
                                  onChange={e => updateForm('unit', e.target.value)}
                                  className={INPUT}
                                  placeholder="kg, pack, bottle"
                                />
                              </Field>
                              <Field label="หมวดหมู่">
                                <select
                                  value={editForm.category}
                                  onChange={e => updateForm('category', e.target.value)}
                                  className={INPUT}
                                >
                                  {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="ผู้จัดส่ง">
                                <input
                                  value={editForm.supplier}
                                  onChange={e => updateForm('supplier', e.target.value)}
                                  className={INPUT}
                                />
                              </Field>
                              <Field label="Par Level">
                                <input
                                  type="number"
                                  value={editForm.parLevel || ''}
                                  onChange={e => updateForm('parLevel', parseFloat(e.target.value) || 0)}
                                  className={INPUT}
                                  placeholder="0"
                                />
                              </Field>
                              <Field label="ราคา/หน่วย (฿)">
                                <input
                                  type="number"
                                  value={editForm.costPerUnit || ''}
                                  onChange={e => updateForm('costPerUnit', parseFloat(e.target.value) || 0)}
                                  className={INPUT}
                                  placeholder="0"
                                />
                              </Field>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={handleSave}
                                disabled={!editForm.nameTh}
                                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="border border-slate-300 px-4 py-1.5 rounded-lg text-xs hover:bg-white transition-colors"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}

                  {/* New item form — appended at bottom of this category */}
                  {showNewHere && newItem && (
                    <tr className="border-b border-blue-200 bg-blue-50">
                      <td colSpan={7} className="px-4 py-4">
                        <p className="text-xs font-semibold text-blue-700 mb-3">+ เพิ่มรายการใหม่</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Field label="ชื่อไทย *">
                            <input
                              value={newItem.nameTh}
                              onChange={e => updateNew('nameTh', e.target.value)}
                              className={INPUT}
                              placeholder="หมูบด"
                              autoFocus
                            />
                          </Field>
                          <Field label="ชื่ออังกฤษ">
                            <input
                              value={newItem.nameEn}
                              onChange={e => updateNew('nameEn', e.target.value)}
                              className={INPUT}
                              placeholder="Minced Pork"
                            />
                          </Field>
                          <Field label="หน่วย">
                            <input
                              value={newItem.unit}
                              onChange={e => updateNew('unit', e.target.value)}
                              className={INPUT}
                              placeholder="kg, pack, bottle"
                            />
                          </Field>
                          <Field label="หมวดหมู่">
                            <select
                              value={newItem.category}
                              onChange={e => updateNew('category', e.target.value as Category)}
                              className={INPUT}
                            >
                              {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="ผู้จัดส่ง">
                            <input
                              value={newItem.supplier}
                              onChange={e => updateNew('supplier', e.target.value)}
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Par Level">
                            <input
                              type="number"
                              value={newItem.parLevel || ''}
                              onChange={e => updateNew('parLevel', parseFloat(e.target.value) || 0)}
                              className={INPUT}
                              placeholder="0"
                            />
                          </Field>
                          <Field label="ราคา/หน่วย (฿)">
                            <input
                              type="number"
                              value={newItem.costPerUnit || ''}
                              onChange={e => updateNew('costPerUnit', parseFloat(e.target.value) || 0)}
                              className={INPUT}
                              placeholder="0"
                            />
                          </Field>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleSaveNew}
                            disabled={!newItem.nameTh}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setNewItem(null)}
                            className="border border-slate-300 px-4 py-1.5 rounded-lg text-xs hover:bg-white transition-colors"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {catItems.length === 0 && !showNewHere && (
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

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block font-medium">{label}</label>
      {children}
    </div>
  )
}
