'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getItems,
  getStockRecords,
  getDailyPL,
  getDailyPLs,
  getSelectedBranch,
  calcMaeManee,
  calcTotalRevenue,
} from '@/lib/storage'
import type { StockItem, DailyStockRecord, DailyPL, Branch } from '@/lib/types'
import { BRANCH_NAMES } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

const BRANCH_TINT: Record<Branch, { text: string; badge: string; bar: string; soft: string; ring: string }> = {
  lasalle: { text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-500',    soft: 'bg-blue-50',    ring: 'ring-blue-200' },
  udomsuk: { text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', soft: 'bg-emerald-50', ring: 'ring-emerald-200' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [items, setItems] = useState<StockItem[]>([])
  const [records, setRecords] = useState<DailyStockRecord[]>([])
  const [pl, setPL] = useState<DailyPL | null>(null)
  const [date, setDate] = useState(today())
  const [bothBranchPLs, setBothBranchPLs] = useState<{ lasalle: DailyPL[]; udomsuk: DailyPL[] }>({ lasalle: [], udomsuk: [] })

  useEffect(() => {
    const b = getSelectedBranch()
    if (!b) { router.push('/'); return }
    setBranch(b)
    setItems(getItems())
    setRecords(getStockRecords(b, date))
    setPL(getDailyPL(b, date))
    setBothBranchPLs({
      lasalle: getDailyPLs('lasalle'),
      udomsuk: getDailyPLs('udomsuk'),
    })
  }, [date, router])

  if (!branch) return null

  const tint = BRANCH_TINT[branch]
  const totalRevenue = pl ? calcTotalRevenue(pl) : 0
  const maeManee = pl ? calcMaeManee(pl) : 0
  const pct = pl && pl.targetRevenue > 0
    ? Math.min(100, Math.round((totalRevenue / pl.targetRevenue) * 100))
    : 0

  const lowStock = records.filter(r => {
    const item = items.find(i => i.id === r.itemId)
    const par = item?.parLevels?.[branch] ?? 0
    return item && par > 0 && r.closingStock < par * 0.3
  })

  // Branch-aware items count
  const branchItems = items.filter(i => i.active && (!i.branches || i.branches.includes(branch)))
  const orderedCount = records.filter(r => r.ordered).length

  // Last 7 days revenue trend for current branch
  const trend7 = last7Days(date).map(d => {
    const found = bothBranchPLs[branch].find(p => p.date === d)
    return { date: d, total: found ? calcTotalRevenue(found) : 0, target: found?.targetRevenue ?? 0 }
  })
  const trendMax = Math.max(1, ...trend7.map(t => Math.max(t.total, t.target)))

  // Monthly aggregates for both branches (this month)
  const ym = date.slice(0, 7)
  const monthlyA = aggregateMonth(bothBranchPLs.lasalle, ym)
  const monthlyB = aggregateMonth(bothBranchPLs.udomsuk, ym)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">แดชบอร์ด</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tint.badge}`}>
              {BRANCH_NAMES[branch]}
            </span>
          </div>
          <p className="text-xs text-slate-400">Dashboard · {date}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm"
        />
      </div>

      {/* Top-line KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI
          icon="🎯" label="เป้าหมายวันนี้" sub="Target"
          value={`฿${(pl?.targetRevenue ?? 0).toLocaleString()}`}
          color="slate"
        />
        <KPI
          icon="💰" label="รายได้รวม" sub="Total Revenue"
          value={`฿${totalRevenue.toLocaleString()}`}
          color={pl && totalRevenue >= pl.targetRevenue ? 'green' : pl ? 'amber' : 'slate'}
          delta={pl ? totalRevenue - pl.targetRevenue : undefined}
        />
        <KPI
          icon="📊" label="ความคืบหน้า" sub="vs Target"
          value={`${pct}%`}
          color={pct >= 100 ? 'green' : pct >= 70 ? 'amber' : 'red'}
        />
        <KPI
          icon="🏦" label="แม่มณี" sub="Net Transfer"
          value={`฿${maeManee.toLocaleString()}`}
          color="slate"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* 7-day revenue spark — spans 2 cols on lg */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-700">รายได้ 7 วันล่าสุด</h2>
              <p className="text-xs text-slate-400">Revenue · last 7 days</p>
            </div>
            <Link href="/pl" className={`text-xs font-medium ${tint.text} hover:underline`}>ดูทั้งหมด →</Link>
          </div>
          <div className="flex items-end justify-between gap-2 h-44">
            {trend7.map(t => {
              const h = (t.total / trendMax) * 100
              const targetH = (t.target / trendMax) * 100
              const isSelected = t.date === date
              const dow = new Date(t.date).toLocaleDateString('th-TH', { weekday: 'short' })
              return (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="text-[10px] text-slate-500 font-medium">
                    {t.total > 0 ? `฿${(t.total / 1000).toFixed(t.total >= 10000 ? 0 : 1)}k` : '—'}
                  </div>
                  <div className="w-full flex-1 flex items-end relative">
                    {t.target > 0 && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300"
                        style={{ bottom: `${targetH}%` }}
                      />
                    )}
                    <div
                      className={`w-full rounded-md transition-all ${isSelected ? tint.bar : 'bg-slate-200'} ${isSelected ? '' : 'hover:bg-slate-300'}`}
                      style={{ height: `${Math.max(h, 2)}%` }}
                    />
                  </div>
                  <div className={`text-[10px] ${isSelected ? `font-bold ${tint.text}` : 'text-slate-400'}`}>
                    {dow}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">⋯ เส้นประ = เป้าหมายของแต่ละวัน</p>
        </div>

        {/* Stock health summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-4">สรุปสต็อก</h2>
          <div className="space-y-3 text-sm">
            <StatRow label="รายการที่ใช้งาน" value={branchItems.length} unit="รายการ" />
            <StatRow label="บันทึกวันนี้" value={records.length} unit="รายการ" />
            <StatRow
              label="สั่งซื้อแล้ว"
              value={orderedCount}
              unit={`/ ${records.length || '—'}`}
              accent={orderedCount > 0 ? 'green' : undefined}
            />
            <StatRow
              label="สต็อกต่ำ"
              value={lowStock.length}
              unit="รายการ"
              accent={lowStock.length > 0 ? 'red' : undefined}
            />
          </div>
          <Link
            href="/daily"
            className={`mt-4 block text-center text-xs font-medium ${tint.text} py-2 rounded-lg ${tint.soft} hover:opacity-80 transition`}
          >
            ไปบันทึกสต็อก →
          </Link>
        </div>
      </div>

      {/* Two-branch monthly comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="font-semibold text-slate-700">เทียบรายได้ระหว่างสาขา (เดือนนี้)</h2>
            <p className="text-xs text-slate-400">Branch comparison · this month</p>
          </div>
          <Link href="/pl" className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline">
            ดูรายเดือน →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <BranchMonthCard branch="lasalle" agg={monthlyA} />
          <BranchMonthCard branch="udomsuk" agg={monthlyB} />
        </div>
      </div>

      {/* Alerts */}
      {!pl && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex items-center justify-between">
          <span>ยังไม่มีข้อมูลรายได้สำหรับวันที่เลือก</span>
          <Link href="/pl" className="font-medium underline">บันทึกรายได้ →</Link>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-red-700 mb-2 text-sm">
            ⚠️ สต็อกต่ำกว่า 30% ของ par ({lowStock.length} รายการ)
          </h2>
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
            {lowStock.map(r => {
              const item = items.find(i => i.id === r.itemId)
              return (
                <li key={r.id} className="text-sm text-red-700">
                  <span className="font-medium">{item?.nameTh}</span> — เหลือ <strong>{r.closingStock}</strong> {item?.unit}{' '}
                  <span className="text-red-400 text-xs">(par: {item?.parLevels?.[branch] ?? 0})</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction href="/daily" icon="📦" title="บันทึกสต็อก"  sub="Daily Stock" />
        <QuickAction href="/pl"    icon="💰" title="บันทึกรายได้" sub="Daily P&L" />
        <QuickAction href="/items" icon="🗂️" title="จัดการสินค้า" sub="Stock Items" />
        <QuickAction href="/settings" icon="⚙️" title="ตั้งค่า / นำเข้า-ส่งออก" sub="Settings" />
      </div>
    </div>
  )
}

function last7Days(anchor: string): string[] {
  const out: string[] = []
  const d = new Date(anchor)
  for (let i = 6; i >= 0; i--) {
    const c = new Date(d)
    c.setDate(d.getDate() - i)
    out.push(c.toISOString().split('T')[0])
  }
  return out
}

function aggregateMonth(pls: DailyPL[], ym: string) {
  let total = 0, target = 0, days = 0
  for (const p of pls) {
    if (!p.date.startsWith(ym)) continue
    total += calcTotalRevenue(p)
    target += p.targetRevenue
    days += 1
  }
  return { total, target, days }
}

function KPI({
  icon, label, sub, value, color, delta,
}: {
  icon: string; label: string; sub: string; value: string
  color: 'green' | 'amber' | 'red' | 'slate'
  delta?: number
}) {
  const colors: Record<string, string> = {
    green: 'bg-gradient-to-br from-green-50 to-white border-green-200 text-green-700',
    amber: 'bg-gradient-to-br from-amber-50 to-white border-amber-200 text-amber-700',
    red:   'bg-gradient-to-br from-red-50 to-white border-red-200 text-red-600',
    slate: 'bg-white border-slate-200 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-medium opacity-70">{label}</p>
      </div>
      <p className="text-[10px] opacity-40 mb-1">{sub}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {delta !== undefined && (
        <p className={`text-xs font-medium mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '▲' : '▼'} ฿{Math.abs(delta).toLocaleString()}
        </p>
      )}
    </div>
  )
}

function StatRow({
  label, value, unit, accent,
}: {
  label: string; value: number; unit: string; accent?: 'red' | 'green'
}) {
  const c = accent === 'red' ? 'text-red-600' : accent === 'green' ? 'text-green-600' : 'text-slate-800'
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">
        <span className={c}>{value}</span>
        <span className="text-slate-400 text-xs ml-1">{unit}</span>
      </span>
    </div>
  )
}

function BranchMonthCard({ branch, agg }: { branch: Branch; agg: { total: number; target: number; days: number } }) {
  const tint = BRANCH_TINT[branch]
  const pct = agg.target > 0 ? Math.round((agg.total / agg.target) * 100) : 0
  return (
    <div className={`rounded-xl border border-slate-200 p-5 ${tint.soft}`}>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className={`font-semibold ${tint.text}`}>{BRANCH_NAMES[branch]}</h3>
        <span className={`text-xs font-bold ${pct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>{pct}%</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">฿{agg.total.toLocaleString()}</p>
      <div className="flex items-baseline gap-3 mt-1 text-xs text-slate-500">
        <span>เป้า ฿{agg.target.toLocaleString()}</span>
        <span>· {agg.days} วัน</span>
      </div>
      <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full ${tint.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}

function QuickAction({ href, icon, title, sub }: { href: string; icon: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3"
    >
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{title}</p>
        <p className="text-xs text-slate-400 truncate">{sub}</p>
      </div>
    </Link>
  )
}
