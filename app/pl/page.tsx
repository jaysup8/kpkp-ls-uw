'use client'
import { useEffect, useState } from 'react'
import { getDailyPL, getDailyPLs, saveDailyPL } from '@/lib/storage'
import type { DailyPL } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

const EMPTY_PL = (date: string): DailyPL => ({
  date,
  targetRevenue: 0,
  cashSales: 0,
  transferSales: 0,
  linemanSales: 0,
  otherSales: 0,
  notes: '',
})

export default function PLPage() {
  const [date, setDate] = useState(today())
  const [form, setForm] = useState<DailyPL>(EMPTY_PL(today()))
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<DailyPL[]>([])

  useEffect(() => {
    setForm(getDailyPL(date) ?? EMPTY_PL(date))
    setSaved(false)
  }, [date])

  useEffect(() => {
    setHistory(getDailyPLs().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30))
  }, [saved])

  function update(field: keyof DailyPL, value: number | string) {
    setForm(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveDailyPL({ ...form, date })
    setSaved(true)
    setHistory(getDailyPLs().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30))
  }

  const totalRevenue =
    form.cashSales + form.transferSales + form.linemanSales + form.otherSales
  const diff = totalRevenue - form.targetRevenue
  const pct =
    form.targetRevenue > 0 ? Math.min(100, Math.round((totalRevenue / form.targetRevenue) * 100)) : 0

  const channels = [
    { label: 'เงินสด', key: 'cashSales' as const, color: 'bg-blue-500' },
    { label: 'เงินโอน', key: 'transferSales' as const, color: 'bg-purple-500' },
    { label: 'Lineman', key: 'linemanSales' as const, color: 'bg-green-500' },
    { label: 'อื่นๆ', key: 'otherSales' as const, color: 'bg-slate-400' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">บันทึกรายได้ / P&L</h1>
          <p className="text-xs text-slate-500">Daily Sales & Profit/Loss</p>
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

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Entry form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-5">
            ข้อมูลรายได้ · {date}
          </h2>
          <div className="space-y-4">
            <Field
              label="เป้าหมาย"
              sub="Target"
              value={form.targetRevenue}
              onChange={v => update('targetRevenue', v)}
            />
            <Field
              label="เงินสด"
              sub="Cash"
              value={form.cashSales}
              onChange={v => update('cashSales', v)}
            />
            <Field
              label="เงินโอน"
              sub="Transfer"
              value={form.transferSales}
              onChange={v => update('transferSales', v)}
            />
            <Field
              label="Lineman"
              sub="Delivery"
              value={form.linemanSales}
              onChange={v => update('linemanSales', v)}
            />
            <Field
              label="อื่นๆ"
              sub="Other"
              value={form.otherSales}
              onChange={v => update('otherSales', v)}
            />
          </div>
        </div>

        {/* Summary column */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-700 mb-4">สรุปวันที่ {date}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">รายได้รวม</span>
                <span className="font-bold text-lg text-slate-800">
                  ฿{totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เป้าหมาย</span>
                <span className="text-slate-700">฿{form.targetRevenue.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-1 flex justify-between">
                <span className="font-medium text-slate-600">ส่วนต่าง</span>
                <span
                  className={`font-bold text-base ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {diff >= 0 ? '+' : ''}฿{diff.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 font-medium">ความคืบหน้า</span>
              <span className={`font-bold ${pct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {pct}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-medium text-slate-700 mb-3 text-sm">ช่องทางการขาย</h3>
            <div className="space-y-2">
              {channels.map(c => {
                const val = form[c.key]
                const barPct = totalRevenue > 0 ? (val / totalRevenue) * 100 : 0
                return (
                  <div key={c.key} className="flex items-center gap-2 text-sm">
                    <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                    <span className="text-slate-600 w-20 shrink-0">{c.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.color}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-slate-700 font-medium w-24 text-right">
                      ฿{val.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-700">ประวัติรายได้ (30 วันล่าสุด)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                <th className="text-left px-4 py-3 font-medium text-slate-600">วันที่</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">เป้าหมาย</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">เงินสด</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">เงินโอน</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Lineman</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">รวม</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">ส่วนต่าง</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, idx) => {
                const total = h.cashSales + h.transferSales + h.linemanSales + h.otherSales
                const d = total - h.targetRevenue
                return (
                  <tr
                    key={h.date}
                    className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-2 font-medium">{h.date}</td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      ฿{h.targetRevenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">฿{h.cashSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.transferSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.linemanSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      ฿{total.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${d >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {d >= 0 ? '+' : ''}฿{d.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  sub,
  value,
  onChange,
}: {
  label: string
  sub: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
        <input
          type="number"
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  )
}
