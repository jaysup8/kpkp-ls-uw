'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getDailyPL,
  getDailyPLs,
  saveDailyPL,
  getSelectedBranch,
  calcMaeManee,
  calcTotalRevenue,
} from '@/lib/storage'
import type { DailyPL, Branch } from '@/lib/types'
import { BRANCH_NAMES } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

function emptyPL(date: string, branch: Branch): DailyPL {
  return {
    date, branch,
    targetRevenue: 0,
    cashSales: 0,
    transferTotal: 0,
    linemanSales: 0,
    grabSales: 0,
    robinhoodSales: 0,
    shopeeSales: 0,
    notes: '',
  }
}

const BRANCH_BADGE: Record<Branch, string> = {
  lasalle:  'bg-blue-100 text-blue-700',
  udomsuk:  'bg-emerald-100 text-emerald-700',
}

export default function PLPage() {
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [date, setDate] = useState(today())
  const [form, setForm] = useState<DailyPL | null>(null)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<DailyPL[]>([])

  useEffect(() => {
    const b = getSelectedBranch()
    if (!b) { router.push('/'); return }
    setBranch(b)
    setForm(getDailyPL(b, date) ?? emptyPL(date, b))
    setSaved(false)
  }, [date, router])

  useEffect(() => {
    if (!branch) return
    setHistory(getDailyPLs(branch).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30))
  }, [branch, saved])

  function update(field: keyof DailyPL, value: number | string) {
    setForm(f => f ? { ...f, [field]: value } : f)
    setSaved(false)
  }

  function handleSave() {
    if (!form || !branch) return
    saveDailyPL(branch, { ...form, date, branch })
    setSaved(true)
    setHistory(getDailyPLs(branch).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30))
  }

  if (!branch || !form) return null

  const maeManee = calcMaeManee(form)
  const totalRevenue = calcTotalRevenue(form)
  const diff = totalRevenue - form.targetRevenue
  const pct = form.targetRevenue > 0
    ? Math.min(100, Math.round((totalRevenue / form.targetRevenue) * 100))
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">บันทึกรายได้ / P&L</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BRANCH_BADGE[branch]}`}>
              {BRANCH_NAMES[branch]}
            </span>
          </div>
          <p className="text-xs text-slate-400">Daily Sales & Profit/Loss</p>
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
          <h2 className="font-semibold text-slate-700 mb-5">กรอกรายได้ · {date}</h2>
          <div className="space-y-3">
            <Field label="เป้าหมาย" sub="Target" value={form.targetRevenue} onChange={v => update('targetRevenue', v)} accent />
            <div className="border-t pt-3 mt-1" />
            <Field label="เงินสด" sub="Cash" value={form.cashSales} onChange={v => update('cashSales', v)} />
            <Field label="เงินโอน" sub="Total Bank Transfer" value={form.transferTotal} onChange={v => update('transferTotal', v)} />
            <Field label="Lineman" sub="Lineman Delivery" value={form.linemanSales} onChange={v => update('linemanSales', v)} />
            <Field label="Grab" sub="GrabFood" value={form.grabSales} onChange={v => update('grabSales', v)} />
            <Field label="Robinhood" sub="Robinhood" value={form.robinhoodSales} onChange={v => update('robinhoodSales', v)} />
            <Field label="Shopee" sub="ShopeeFood" value={form.shopeeSales} onChange={v => update('shopeeSales', v)} />

            {/* Auto-calculated เงินโอนแม่มณี */}
            <div className="border-t pt-3 mt-1">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-700">เงินโอนแม่มณี</p>
                  <p className="text-xs text-slate-400">= เงินโอน − Grab − Robinhood − Shopee</p>
                </div>
                <p className={`text-lg font-bold ${maeManee < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  ฿{maeManee.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary column */}
        <div className="space-y-4">
          {/* Total */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-700 mb-4">สรุปรายได้</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'เงินสด', value: form.cashSales },
                { label: 'เงินโอนแม่มณี', value: maeManee },
                { label: 'Lineman', value: form.linemanSales },
                { label: 'Grab', value: form.grabSales },
                { label: 'Robinhood', value: form.robinhoodSales },
                { label: 'Shopee', value: form.shopeeSales },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-medium">฿{r.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-1 flex justify-between">
                <span className="font-bold text-slate-800">รายได้รวม</span>
                <span className="font-bold text-xl text-slate-800">฿{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เป้าหมาย</span>
                <span>฿{form.targetRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-1">
                <span className="font-medium text-slate-600">ส่วนต่าง</span>
                <span className={`font-bold text-base ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {diff >= 0 ? '+' : ''}฿{diff.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 font-medium">ความคืบหน้า</span>
              <span className={`font-bold ${pct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>{pct}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Channel bars */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-medium text-slate-700 mb-3 text-sm">สัดส่วนช่องทางการขาย</h3>
            <div className="space-y-2">
              {[
                { label: 'เงินสด',         value: form.cashSales,        color: 'bg-blue-400' },
                { label: 'เงินโอนแม่มณี',  value: maeManee,              color: 'bg-purple-400' },
                { label: 'Lineman',         value: form.linemanSales,     color: 'bg-green-400' },
                { label: 'Grab',            value: form.grabSales,        color: 'bg-lime-400' },
                { label: 'Robinhood',       value: form.robinhoodSales,   color: 'bg-red-400' },
                { label: 'Shopee',          value: form.shopeeSales,      color: 'bg-orange-400' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.color}`} />
                  <span className="text-slate-600 w-28 shrink-0">{c.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.color}`}
                      style={{ width: `${totalRevenue > 0 && c.value > 0 ? Math.max(2, (c.value / totalRevenue) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-slate-700 font-medium w-20 text-right">฿{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-700">ประวัติรายได้ — {BRANCH_NAMES[branch]} (30 วันล่าสุด)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                <th className="text-left px-4 py-3 font-medium text-slate-600">วันที่</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">เป้าหมาย</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">เงินสด</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">แม่มณี</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Lineman</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Grab</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Robin</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Shopee</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">รวม</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">ส่วนต่าง</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, idx) => {
                const mm = calcMaeManee(h)
                const total = calcTotalRevenue(h)
                const d = total - h.targetRevenue
                return (
                  <tr key={h.date} className={`border-b border-slate-100 ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2 font-medium">{h.date}</td>
                    <td className="px-4 py-2 text-right text-slate-500">฿{h.targetRevenue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.cashSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{mm.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.linemanSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.grabSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.robinhoodSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">฿{h.shopeeSales.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-semibold">฿{total.toLocaleString()}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {d >= 0 ? '+' : ''}฿{d.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">ยังไม่มีข้อมูล</td>
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
  label, sub, value, onChange, accent,
}: {
  label: string; sub: string; value: number; onChange: (v: number) => void; accent?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0">
        <p className={`text-sm font-medium ${accent ? 'text-blue-700' : 'text-slate-700'}`}>{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
        <input
          type="number"
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            accent
              ? 'border-blue-300 focus:ring-blue-400 bg-blue-50'
              : 'border-slate-200 focus:ring-blue-400'
          }`}
        />
      </div>
    </div>
  )
}
