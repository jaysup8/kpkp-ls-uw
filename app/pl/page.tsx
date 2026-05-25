'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSelectedBranch,
  calcMaeManee,
  calcTotalRevenue,
  calcTotalExpenses,
} from '@/lib/storage'
import { fetchDailyPL, fetchDailyPLs, saveDailyPL } from '@/lib/api'
import type { DailyPL, Branch, OtherExpense } from '@/lib/types'
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
    freshMarketExpense: 0,
    freshketExpense: 0,
    makroExpense: 0,
    franchisorExpense: 0,
    otherExpenses: [],
    notes: '',
  }
}

const BRANCH_BADGE: Record<Branch, string> = {
  lasalle:  'bg-blue-100 text-blue-700',
  udomsuk:  'bg-emerald-100 text-emerald-700',
}

const BRANCH_TINT: Record<Branch, { bar: string; soft: string; text: string }> = {
  lasalle:  { bar: 'bg-blue-500',    soft: 'bg-blue-50',    text: 'text-blue-700' },
  udomsuk:  { bar: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700' },
}

const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${THAI_MONTHS_SHORT[parseInt(m) - 1]} ${y}`
}

type View = 'day' | 'month' | 'compare'

export default function PLPage() {
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [date, setDate] = useState(today())
  const [form, setForm] = useState<DailyPL | null>(null)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<DailyPL[]>([])
  const [view, setView] = useState<View>('day')
  const [otherBranchPLs, setOtherBranchPLs] = useState<DailyPL[]>([])

  useEffect(() => {
    const b = getSelectedBranch()
    if (!b) { router.push('/'); return }
    setBranch(b)
    fetchDailyPL(b, date).then(pl => setForm(pl ?? emptyPL(date, b))).catch(console.error)
    setSaved(false)
  }, [date, router])

  useEffect(() => {
    if (!branch) return
    fetchDailyPLs(branch).then(pls => setHistory([...pls].sort((a, b) => b.date.localeCompare(a.date)))).catch(console.error)
    const other: Branch = branch === 'lasalle' ? 'udomsuk' : 'lasalle'
    fetchDailyPLs(other).then(setOtherBranchPLs).catch(console.error)
  }, [branch, saved])

  function update(field: keyof DailyPL, value: number | string) {
    setForm(f => f ? { ...f, [field]: value } : f)
    setSaved(false)
  }

  function addOtherExpense() {
    setForm(f => f ? { ...f, otherExpenses: [...(f.otherExpenses ?? []), { description: '', amount: 0 }] } : f)
    setSaved(false)
  }

  function updateOtherExpense(idx: number, patch: Partial<OtherExpense>) {
    setForm(f => {
      if (!f) return f
      const next = [...(f.otherExpenses ?? [])]
      next[idx] = { ...next[idx], ...patch }
      return { ...f, otherExpenses: next }
    })
    setSaved(false)
  }

  function removeOtherExpense(idx: number) {
    setForm(f => {
      if (!f) return f
      return { ...f, otherExpenses: (f.otherExpenses ?? []).filter((_, i) => i !== idx) }
    })
    setSaved(false)
  }

  async function handleSave() {
    if (!form || !branch) return
    await saveDailyPL({ ...form, date, branch })
    setSaved(true)
    fetchDailyPLs(branch).then(pls => setHistory([...pls].sort((a, b) => b.date.localeCompare(a.date)))).catch(console.error)
  }

  if (!branch || !form) return null

  const maeManee = calcMaeManee(form)
  const totalRevenue = calcTotalRevenue(form)
  const totalExpenses = calcTotalExpenses(form)
  const netProfit = totalRevenue - totalExpenses
  const diff = totalRevenue - form.targetRevenue
  const pct = form.targetRevenue > 0
    ? Math.min(100, Math.round((totalRevenue / form.targetRevenue) * 100))
    : 0

  // ---------- Monthly aggregation helpers ----------
  function aggregateByMonth(pls: DailyPL[]): Map<string, { total: number; target: number; expenses: number; net: number; days: number; pls: DailyPL[] }> {
    const m = new Map<string, { total: number; target: number; expenses: number; net: number; days: number; pls: DailyPL[] }>()
    for (const p of pls) {
      const ym = p.date.slice(0, 7)
      const bucket = m.get(ym) ?? { total: 0, target: 0, expenses: 0, net: 0, days: 0, pls: [] }
      const rev = calcTotalRevenue(p)
      const exp = calcTotalExpenses(p)
      bucket.total += rev
      bucket.expenses += exp
      bucket.net += (rev - exp)
      bucket.target += p.targetRevenue
      bucket.days += 1
      bucket.pls.push(p)
      m.set(ym, bucket)
    }
    return m
  }

  const monthsCurrent = aggregateByMonth(history)
  const monthsOther = aggregateByMonth(otherBranchPLs)
  const currentMonth = date.slice(0, 7)
  const otherBranch: Branch = branch === 'lasalle' ? 'udomsuk' : 'lasalle'

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
          {view === 'day' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {([
          { v: 'day' as View,     label: 'รายวัน',      sub: 'Day' },
          { v: 'month' as View,   label: 'รายเดือน',    sub: 'Monthly' },
          { v: 'compare' as View, label: 'เทียบสาขา',  sub: 'Compare' },
        ]).map(t => (
          <button
            key={t.v}
            onClick={() => setView(t.v)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              view === t.v
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label} <span className="text-xs opacity-60">{t.sub}</span>
          </button>
        ))}
      </div>

      {view === 'day' && <>
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

            {/* ----- Expenses section ----- */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="font-semibold text-red-700 text-sm">รายจ่ายประจำวัน</h3>
                <span className="text-xs text-slate-400">Daily Expenses</span>
              </div>
              <div className="space-y-2.5">
                <Field label="ตลาดสด"     sub="Fresh Market" value={form.freshMarketExpense ?? 0} onChange={v => update('freshMarketExpense', v)} expense />
                <Field label="Freshket"    sub="Freshket"     value={form.freshketExpense ?? 0}    onChange={v => update('freshketExpense', v)}    expense />
                <Field label="Makro"       sub="Makro"        value={form.makroExpense ?? 0}        onChange={v => update('makroExpense', v)}        expense />
                <Field label="Franchisor"  sub="ส่งจากแฟรนไชส์" value={form.franchisorExpense ?? 0}  onChange={v => update('franchisorExpense', v)}  expense />

                {/* Other expenses with custom descriptions */}
                <div className="bg-red-50/40 rounded-lg p-3 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-700">อื่นๆ <span className="text-xs text-slate-400">Others</span></p>
                    <button
                      onClick={addOtherExpense}
                      className="text-xs font-medium text-red-700 hover:text-red-800 px-2 py-0.5 rounded bg-white border border-red-200 hover:bg-red-50"
                    >
                      + เพิ่มรายการ
                    </button>
                  </div>
                  {(form.otherExpenses ?? []).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">ยังไม่มีรายการ — กด + เพื่อเพิ่ม</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(form.otherExpenses ?? []).map((e, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={e.description}
                            onChange={ev => updateOtherExpense(i, { description: ev.target.value })}
                            placeholder="รายละเอียด เช่น น้ำแข็ง, น้ำมัน, ค่าส่ง..."
                            className="flex-1 min-w-0 border border-red-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">฿</span>
                            <input
                              type="number"
                              value={e.amount || ''}
                              placeholder="0"
                              onChange={ev => updateOtherExpense(i, { amount: parseFloat(ev.target.value) || 0 })}
                              className="w-full border border-red-200 rounded-lg pl-5 pr-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-300 text-right"
                            />
                          </div>
                          <button
                            onClick={() => removeOtherExpense(i)}
                            title="ลบ"
                            className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total expenses auto-line */}
                <div className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5 border border-red-100">
                  <div>
                    <p className="text-sm font-semibold text-red-700">รายจ่ายรวม</p>
                    <p className="text-xs text-red-400">Total Expenses</p>
                  </div>
                  <p className="text-lg font-bold text-red-700">฿{totalExpenses.toLocaleString()}</p>
                </div>
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

          {/* Expense summary + net profit */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-red-700 mb-4">สรุปรายจ่ายและกำไร</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'ตลาดสด',    value: form.freshMarketExpense ?? 0 },
                { label: 'Freshket',   value: form.freshketExpense    ?? 0 },
                { label: 'Makro',      value: form.makroExpense       ?? 0 },
                { label: 'Franchisor', value: form.franchisorExpense  ?? 0 },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-medium">฿{r.value.toLocaleString()}</span>
                </div>
              ))}
              {(form.otherExpenses ?? []).map((e, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-500">↳ {e.description || `อื่นๆ ${i + 1}`}</span>
                  <span className="font-medium">฿{(e.amount || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-1 flex justify-between">
                <span className="font-bold text-red-700">รายจ่ายรวม</span>
                <span className="font-bold text-red-700">฿{totalExpenses.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 mt-2 flex justify-between items-baseline">
                <div>
                  <p className="font-bold text-slate-800">กำไรสุทธิ</p>
                  <p className="text-xs text-slate-400">Net = รายได้ − รายจ่าย</p>
                </div>
                <span className={`font-bold text-2xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{netProfit.toLocaleString()}
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
                <th className="text-right px-4 py-3 font-medium text-red-600">รายจ่าย</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">กำไรสุทธิ</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">ส่วนต่าง</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 30).map((h, idx) => {
                const mm = calcMaeManee(h)
                const total = calcTotalRevenue(h)
                const exp = calcTotalExpenses(h)
                const net = total - exp
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
                    <td className="px-4 py-2 text-right text-red-600">{exp > 0 ? `฿${exp.toLocaleString()}` : '—'}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ฿{net.toLocaleString()}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {d >= 0 ? '+' : ''}฿{d.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-slate-400">ยังไม่มีข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>}

      {view === 'month' && (
        <MonthlyView months={monthsCurrent} branch={branch} currentMonth={currentMonth} />
      )}

      {view === 'compare' && (
        <CompareView
          branch={branch}
          otherBranch={otherBranch}
          monthsCurrent={monthsCurrent}
          monthsOther={monthsOther}
          currentMonth={currentMonth}
        />
      )}
    </div>
  )
}

// ============================== Monthly view ==============================

type MonthAgg = { total: number; target: number; expenses: number; net: number; days: number; pls: DailyPL[] }

function MonthlyView({
  months, branch, currentMonth,
}: {
  months: Map<string, MonthAgg>
  branch: Branch
  currentMonth: string
}) {
  const sorted = Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  const current = months.get(currentMonth)
  const tint = BRANCH_TINT[branch]
  const maxTotal = Math.max(1, ...sorted.map(([, v]) => v.total))

  return (
    <div className="space-y-6">
      {/* Current month spotlight */}
      {current && (
        <div className={`rounded-2xl border border-slate-200 p-6 shadow-sm ${tint.soft}`}>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">เดือนปัจจุบัน · {fmtMonth(currentMonth)}</p>
              <h2 className={`text-3xl font-bold mt-1 ${tint.text}`}>฿{current.total.toLocaleString()}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">เป้าหมายรวม</p>
              <p className="text-lg font-semibold text-slate-700">฿{current.target.toLocaleString()}</p>
              <p className={`text-sm font-medium mt-1 ${current.total >= current.target ? 'text-green-600' : 'text-red-500'}`}>
                {current.total - current.target >= 0 ? '+' : ''}฿{(current.total - current.target).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">บันทึก</p>
              <p className="font-semibold text-slate-700">{current.days} วัน</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">เฉลี่ย/วัน</p>
              <p className="font-semibold text-slate-700">฿{Math.round(current.total / Math.max(current.days, 1)).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">รายจ่ายรวม</p>
              <p className="font-semibold text-red-600">฿{current.expenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">กำไรสุทธิ</p>
              <p className={`font-semibold ${current.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>฿{current.net.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* All months bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-5">สรุปยอดขายรายเดือน</h2>
        {sorted.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">ยังไม่มีข้อมูล</p>
        )}
        <div className="space-y-3">
          {sorted.map(([ym, v]) => {
            const ach = v.target > 0 ? Math.round((v.total / v.target) * 100) : 0
            return (
              <div key={ym} className={`p-3 rounded-lg ${ym === currentMonth ? 'bg-blue-50/40 border border-blue-100' : ''}`}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-medium text-slate-700 text-sm">{fmtMonth(ym)}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-800">฿{v.total.toLocaleString()}</span>
                    <span className={`text-xs font-medium ${ach >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {ach}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${tint.bar} rounded-full transition-all`} style={{ width: `${(v.total / maxTotal) * 100}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {v.days} วัน · เฉลี่ย ฿{Math.round(v.total / Math.max(v.days, 1)).toLocaleString()}/วัน · เป้า ฿{v.target.toLocaleString()}
                  {v.expenses > 0 && (
                    <span className="ml-2">· รายจ่าย <span className="text-red-500">฿{v.expenses.toLocaleString()}</span> · กำไร <span className={v.net >= 0 ? 'text-green-600' : 'text-red-600'}>฿{v.net.toLocaleString()}</span></span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================== Compare view ==============================

function CompareView({
  branch, otherBranch, monthsCurrent, monthsOther, currentMonth,
}: {
  branch: Branch
  otherBranch: Branch
  monthsCurrent: Map<string, MonthAgg>
  monthsOther: Map<string, MonthAgg>
  currentMonth: string
}) {
  const allMonths = Array.from(new Set([...monthsCurrent.keys(), ...monthsOther.keys()])).sort((a, b) => b.localeCompare(a))
  const tintA = BRANCH_TINT[branch]
  const tintB = BRANCH_TINT[otherBranch]
  const curA = monthsCurrent.get(currentMonth)
  const curB = monthsOther.get(currentMonth)
  const max = Math.max(1,
    ...allMonths.map(m => Math.max(monthsCurrent.get(m)?.total ?? 0, monthsOther.get(m)?.total ?? 0))
  )

  return (
    <div className="space-y-6">
      {/* Current month side-by-side */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { b: branch, label: BRANCH_NAMES[branch], tint: tintA, m: curA },
          { b: otherBranch, label: BRANCH_NAMES[otherBranch], tint: tintB, m: curB },
        ].map(card => (
          <div key={card.b} className={`rounded-2xl border border-slate-200 p-6 shadow-sm ${card.tint.soft}`}>
            <p className="text-xs uppercase tracking-wide text-slate-500">{fmtMonth(currentMonth)}</p>
            <h3 className={`font-semibold mt-0.5 ${card.tint.text}`}>{card.label}</h3>
            <p className="text-3xl font-bold text-slate-800 mt-3">฿{(card.m?.total ?? 0).toLocaleString()}</p>
            <div className="flex items-baseline gap-4 mt-2 text-xs text-slate-500">
              <span>เป้า ฿{(card.m?.target ?? 0).toLocaleString()}</span>
              <span>{card.m?.days ?? 0} วัน</span>
            </div>
            <div className="border-t border-slate-200/60 mt-3 pt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">รายจ่าย</p>
                <p className="font-semibold text-red-600">฿{(card.m?.expenses ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">กำไรสุทธิ</p>
                <p className={`font-semibold ${(card.m?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>฿{(card.m?.net ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-side monthly bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-700">เทียบยอดขายรายเดือน</h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${tintA.bar}`} />
              <span className="text-slate-600">{BRANCH_NAMES[branch]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${tintB.bar}`} />
              <span className="text-slate-600">{BRANCH_NAMES[otherBranch]}</span>
            </div>
          </div>
        </div>
        {allMonths.length === 0 && <p className="text-slate-400 text-sm text-center py-8">ยังไม่มีข้อมูล</p>}
        <div className="space-y-5">
          {allMonths.map(ym => {
            const a = monthsCurrent.get(ym)?.total ?? 0
            const b = monthsOther.get(ym)?.total ?? 0
            const diff = a - b
            return (
              <div key={ym}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-medium text-slate-700 text-sm">{fmtMonth(ym)}</span>
                  <span className={`text-xs font-semibold ${diff > 0 ? tintA.text : diff < 0 ? tintB.text : 'text-slate-500'}`}>
                    {diff > 0 ? `${BRANCH_NAMES[branch]} นำ ฿${diff.toLocaleString()}` : diff < 0 ? `${BRANCH_NAMES[otherBranch]} นำ ฿${(-diff).toLocaleString()}` : 'เท่ากัน'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-slate-500">{BRANCH_NAMES[branch]}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${tintA.bar}`} style={{ width: `${(a / max) * 100}%` }} />
                    </div>
                    <span className="w-24 text-right font-medium text-slate-700">฿{a.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-slate-500">{BRANCH_NAMES[otherBranch]}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${tintB.bar}`} style={{ width: `${(b / max) * 100}%` }} />
                    </div>
                    <span className="w-24 text-right font-medium text-slate-700">฿{b.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Field({
  label, sub, value, onChange, accent, expense,
}: {
  label: string; sub: string; value: number; onChange: (v: number) => void
  accent?: boolean
  expense?: boolean
}) {
  const labelColor = expense ? 'text-red-700' : accent ? 'text-blue-700' : 'text-slate-700'
  const inputStyle = expense
    ? 'border-red-200 focus:ring-red-300 bg-red-50/30'
    : accent
      ? 'border-blue-300 focus:ring-blue-400 bg-blue-50'
      : 'border-slate-200 focus:ring-blue-400'
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0">
        <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
        <input
          type="number"
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${inputStyle}`}
        />
      </div>
    </div>
  )
}
