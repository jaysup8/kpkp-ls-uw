'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getItems, saveItems, getSelectedBranch } from '@/lib/storage'
import type { StockItem, Category, Branch } from '@/lib/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'raw',        label: 'Raw Food' },
  { value: 'freshket',   label: 'Freshket / Makro' },
  { value: 'franchisor', label: 'Franchisor' },
  { value: 'drinks',     label: 'Drinks' },
  { value: 'etc',        label: 'ETC' },
]

const BRANCHES: Branch[] = ['lasalle', 'udomsuk']

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function inBranch(item: StockItem, b: Branch): boolean {
  return !item.branches || item.branches.includes(b)
}

function setBranchActive(item: StockItem, b: Branch, active: boolean): StockItem {
  const other: Branch = b === 'lasalle' ? 'udomsuk' : 'lasalle'
  const otherActive = inBranch(item, other)
  if (active) {
    return { ...item, branches: otherActive ? undefined : [b] }
  } else {
    return { ...item, branches: otherActive ? [other] : [] }
  }
}

const BLANK: Omit<StockItem, 'id'> = {
  nameTh: '', nameEn: '', unit: 'kg', category: 'raw', supplier: '-',
  parLevels: { lasalle: 0, udomsuk: 0 }, costPerUnit: 0, active: true,
  autoOrder: true,  // default ON for new items; user can toggle per-item
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

export default function ItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StockItem | null>(null)
  const [newItem, setNewItem] = useState<StockItem | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!getSelectedBranch()) { router.push('/'); return }
    setItems(getItems())
  }, [router])

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

  function cancelEdit() { setEditingId(null); setEditForm(null) }

  function handleSave() {
    if (!editForm) return
    persist(items.map(i => (i.id === editForm.id ? editForm : i)))
    setEditingId(null); setEditForm(null)
    showToast('บันทึกแล้ว ✓')
  }

  function handleSaveNew() {
    if (!newItem?.nameTh) return
    persist([...items, newItem])
    setNewItem(null)
    showToast('เพิ่มรายการแล้ว ✓')
  }

  function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    if (editingId === id) cancelEdit()
    persist(items.filter(i => i.id !== id))
    showToast('ลบแล้ว')
  }

  // Quick inline toggles — no edit form needed
  function toggleBranchInline(item: StockItem, b: Branch) {
    persist(items.map(i => i.id === item.id ? setBranchActive(i, b, !inBranch(i, b)) : i))
  }

  function updatePar(item: StockItem, b: Branch, val: number) {
    persist(items.map(i => i.id === item.id
      ? { ...i, parLevels: { ...i.parLevels, [b]: val } }
      : i
    ))
  }

  function toggleAutoOrder(item: StockItem) {
    persist(items.map(i => i.id === item.id ? { ...i, autoOrder: !i.autoOrder } : i))
  }

  function setCategoryAutoOrder(category: Category, value: boolean) {
    persist(items.map(i => i.category === category ? { ...i, autoOrder: value } : i))
  }

  function updateForm(field: keyof StockItem, value: any) {
    setEditForm(f => f ? { ...f, [field]: value } : f)
  }

  function updateFormPar(b: Branch, val: number) {
    setEditForm(f => f ? { ...f, parLevels: { ...f.parLevels, [b]: val } } : f)
  }

  function updateNew(field: keyof StockItem, value: any) {
    setNewItem(f => f ? { ...f, [field]: value } : f)
  }

  function updateNewPar(b: Branch, val: number) {
    setNewItem(f => f ? { ...f, parLevels: { ...f.parLevels, [b]: val } } : f)
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
        const catAutoCount = catItems.filter(i => i.autoOrder).length
        const allAuto = catItems.length > 0 && catAutoCount === catItems.length
        const noneAuto = catAutoCount === 0

        return (
          <div key={cat.value} className="mb-8">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h2 className="font-semibold text-slate-700">
                {cat.label}{' '}
                <span className="text-slate-400 font-normal text-sm">({catItems.length} รายการ)</span>
              </h2>
              {catItems.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">สูตร Auto To Order ทั้งหมวด:</span>
                  <button
                    onClick={() => setCategoryAutoOrder(cat.value, true)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors ${allAuto ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    เปิดทั้งหมด
                  </button>
                  <button
                    onClick={() => setCategoryAutoOrder(cat.value, false)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors ${noneAuto ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    ปิดทั้งหมด
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs">
                    <th rowSpan={2} className="text-left px-4 py-3 font-medium text-slate-600 border-b border-slate-200 min-w-[160px]">ชื่อ</th>
                    <th rowSpan={2} className="text-left px-4 py-3 font-medium text-slate-600 border-b border-slate-200 w-16">หน่วย</th>
                    <th colSpan={2} className="text-center px-3 py-2 font-semibold text-blue-700 bg-blue-50 border-b border-l border-blue-100 w-40">
                      🔵 Lasalle
                    </th>
                    <th colSpan={2} className="text-center px-3 py-2 font-semibold text-emerald-700 bg-emerald-50 border-b border-l border-emerald-100 w-40">
                      🟢 Udomsuk
                    </th>
                    <th rowSpan={2} className="text-center px-2 py-3 font-medium text-slate-600 border-b border-slate-200 w-20" title="Auto To Order = Par - Closing Stock">
                      Auto<br /><span className="font-normal opacity-60 text-[10px]">สูตร</span>
                    </th>
                    <th rowSpan={2} className="text-right px-4 py-3 font-medium text-slate-600 border-b border-slate-200 w-20">ราคา/หน่วย</th>
                    <th rowSpan={2} className="px-4 py-3 border-b border-slate-200 w-24" />
                  </tr>
                  <tr className="bg-slate-50 text-xs border-b border-slate-200">
                    <th className="text-center px-2 py-2 font-medium text-slate-500 border-l border-blue-100 w-16">ใช้งาน</th>
                    <th className="text-center px-2 py-2 font-medium text-slate-500 w-20">Par</th>
                    <th className="text-center px-2 py-2 font-medium text-slate-500 border-l border-emerald-100 w-16">ใช้งาน</th>
                    <th className="text-center px-2 py-2 font-medium text-slate-500 w-20">Par</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => (
                    <>
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${editingId === item.id ? 'bg-blue-50' : idx % 2 === 0 ? '' : 'bg-slate-50/50'} ${!item.active ? 'opacity-40' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800">{item.nameTh}</div>
                          <div className="text-xs text-slate-400">{item.nameEn}</div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{item.unit}</td>

                        {/* Lasalle columns */}
                        <td className="px-2 py-2 text-center border-l border-blue-50">
                          <button
                            onClick={() => toggleBranchInline(item, 'lasalle')}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${inBranch(item, 'lasalle') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {inBranch(item, 'lasalle') ? 'ใช้' : 'ไม่ใช้'}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {inBranch(item, 'lasalle') ? (
                            <input
                              type="number"
                              value={item.parLevels.lasalle || ''}
                              placeholder="0"
                              onChange={e => updatePar(item, 'lasalle', parseFloat(e.target.value) || 0)}
                              className="w-16 text-center border border-blue-200 rounded-lg px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
                            />
                          ) : <span className="text-slate-300">—</span>}
                        </td>

                        {/* Udomsuk columns */}
                        <td className="px-2 py-2 text-center border-l border-emerald-50">
                          <button
                            onClick={() => toggleBranchInline(item, 'udomsuk')}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${inBranch(item, 'udomsuk') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {inBranch(item, 'udomsuk') ? 'ใช้' : 'ไม่ใช้'}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {inBranch(item, 'udomsuk') ? (
                            <input
                              type="number"
                              value={item.parLevels.udomsuk || ''}
                              placeholder="0"
                              onChange={e => updatePar(item, 'udomsuk', parseFloat(e.target.value) || 0)}
                              className="w-16 text-center border border-emerald-200 rounded-lg px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-emerald-50"
                            />
                          ) : <span className="text-slate-300">—</span>}
                        </td>

                        {/* Auto To Order toggle */}
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => toggleAutoOrder(item)}
                            title="สูตร Auto To Order = Par - Closing Stock"
                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                              item.autoOrder
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {item.autoOrder ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-500">฿{item.costPerUnit}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => editingId === item.id ? cancelEdit() : startEdit(item)}
                              className={`text-xs font-medium ${editingId === item.id ? 'text-slate-500 hover:underline' : 'text-blue-600 hover:underline'}`}
                            >
                              {editingId === item.id ? 'ยกเลิก' : 'แก้ไข'}
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-xs font-medium">
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline edit form */}
                      {editingId === item.id && editForm && (
                        <tr key={`edit-${item.id}`} className="border-b border-blue-200 bg-blue-50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <Field label="ชื่อไทย *">
                                <input value={editForm.nameTh} onChange={e => updateForm('nameTh', e.target.value)} className={INPUT} placeholder="หมูบด" />
                              </Field>
                              <Field label="ชื่ออังกฤษ">
                                <input value={editForm.nameEn} onChange={e => updateForm('nameEn', e.target.value)} className={INPUT} placeholder="Minced Pork" />
                              </Field>
                              <Field label="หน่วย">
                                <input value={editForm.unit} onChange={e => updateForm('unit', e.target.value)} className={INPUT} placeholder="kg, pack, bottle" />
                              </Field>
                              <Field label="หมวดหมู่">
                                <select value={editForm.category} onChange={e => updateForm('category', e.target.value)} className={INPUT}>
                                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                              </Field>
                              <Field label="ผู้จัดส่ง">
                                <input value={editForm.supplier} onChange={e => updateForm('supplier', e.target.value)} className={INPUT} />
                              </Field>
                              <Field label="ราคา/หน่วย (฿)">
                                <input type="number" value={editForm.costPerUnit || ''} onChange={e => updateForm('costPerUnit', parseFloat(e.target.value) || 0)} className={INPUT} placeholder="0" />
                              </Field>
                              <Field label="Par — Lasalle 🔵">
                                <input type="number" value={editForm.parLevels.lasalle || ''} onChange={e => updateFormPar('lasalle', parseFloat(e.target.value) || 0)} className={INPUT} placeholder="0" />
                              </Field>
                              <Field label="Par — Udomsuk 🟢">
                                <input type="number" value={editForm.parLevels.udomsuk || ''} onChange={e => updateFormPar('udomsuk', parseFloat(e.target.value) || 0)} className={INPUT} placeholder="0" />
                              </Field>
                            </div>
                            <div className="flex items-center gap-4 mb-3 flex-wrap">
                              {BRANCHES.map(b => (
                                <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inBranch(editForm, b)}
                                    onChange={e => setEditForm(f => f ? setBranchActive(f, b, e.target.checked) : f)}
                                    className="w-4 h-4 accent-blue-600"
                                  />
                                  <span className={b === 'lasalle' ? 'text-blue-700 font-medium' : 'text-emerald-700 font-medium'}>
                                    {b === 'lasalle' ? '🔵 ใช้ที่ Lasalle' : '🟢 ใช้ที่ Udomsuk'}
                                  </span>
                                </label>
                              ))}
                              <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto" title="To Order = Par - Closing Stock">
                                <input
                                  type="checkbox"
                                  checked={!!editForm.autoOrder}
                                  onChange={e => updateForm('autoOrder', e.target.checked)}
                                  className="w-4 h-4 accent-emerald-600"
                                />
                                <span className="text-emerald-700 font-medium">⚙️ ใช้สูตร Auto To Order (Par − คงเหลือ)</span>
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSave} disabled={!editForm.nameTh} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                บันทึก
                              </button>
                              <button onClick={cancelEdit} className="border border-slate-300 px-4 py-1.5 rounded-lg text-xs hover:bg-white transition-colors">
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}

                  {/* New item form */}
                  {showNewHere && newItem && (
                    <tr className="border-b border-blue-200 bg-blue-50">
                      <td colSpan={9} className="px-4 py-4">
                        <p className="text-xs font-semibold text-blue-700 mb-3">+ เพิ่มรายการใหม่</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <Field label="ชื่อไทย *">
                            <input value={newItem.nameTh} onChange={e => updateNew('nameTh', e.target.value)} className={INPUT} placeholder="หมูบด" autoFocus />
                          </Field>
                          <Field label="ชื่ออังกฤษ">
                            <input value={newItem.nameEn} onChange={e => updateNew('nameEn', e.target.value)} className={INPUT} placeholder="Minced Pork" />
                          </Field>
                          <Field label="หน่วย">
                            <input value={newItem.unit} onChange={e => updateNew('unit', e.target.value)} className={INPUT} placeholder="kg, pack, bottle" />
                          </Field>
                          <Field label="หมวดหมู่">
                            <select value={newItem.category} onChange={e => updateNew('category', e.target.value as Category)} className={INPUT}>
                              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          </Field>
                          <Field label="ผู้จัดส่ง">
                            <input value={newItem.supplier} onChange={e => updateNew('supplier', e.target.value)} className={INPUT} />
                          </Field>
                          <Field label="ราคา/หน่วย (฿)">
                            <input type="number" value={newItem.costPerUnit || ''} onChange={e => updateNew('costPerUnit', parseFloat(e.target.value) || 0)} className={INPUT} placeholder="0" />
                          </Field>
                          <Field label="Par — Lasalle 🔵">
                            <input type="number" value={newItem.parLevels.lasalle || ''} onChange={e => updateNewPar('lasalle', parseFloat(e.target.value) || 0)} className={INPUT} placeholder="0" />
                          </Field>
                          <Field label="Par — Udomsuk 🟢">
                            <input type="number" value={newItem.parLevels.udomsuk || ''} onChange={e => updateNewPar('udomsuk', parseFloat(e.target.value) || 0)} className={INPUT} placeholder="0" />
                          </Field>
                        </div>
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          {BRANCHES.map(b => (
                            <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inBranch(newItem, b)}
                                onChange={e => setNewItem(f => f ? setBranchActive(f, b, e.target.checked) : f)}
                                className="w-4 h-4 accent-blue-600"
                              />
                              <span className={b === 'lasalle' ? 'text-blue-700 font-medium' : 'text-emerald-700 font-medium'}>
                                {b === 'lasalle' ? '🔵 ใช้ที่ Lasalle' : '🟢 ใช้ที่ Udomsuk'}
                              </span>
                            </label>
                          ))}
                          <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto" title="To Order = Par - Closing Stock">
                            <input
                              type="checkbox"
                              checked={!!newItem.autoOrder}
                              onChange={e => updateNew('autoOrder', e.target.checked)}
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <span className="text-emerald-700 font-medium">⚙️ ใช้สูตร Auto To Order</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveNew} disabled={!newItem.nameTh} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            บันทึก
                          </button>
                          <button onClick={() => setNewItem(null)} className="border border-slate-300 px-4 py-1.5 rounded-lg text-xs hover:bg-white transition-colors">
                            ยกเลิก
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {catItems.length === 0 && !showNewHere && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">ไม่มีรายการ</td>
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
