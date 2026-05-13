'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getItems, getStockRecords, getDailyPL } from '@/lib/storage'
import type { StockItem, DailyStockRecord, DailyPL } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function Dashboard() {
  const [items, setItems] = useState<StockItem[]>([])
  const [records, setRecords] = useState<DailyStockRecord[]>([])
  const [pl, setPL] = useState<DailyPL | null>(null)
  const [date, setDate] = useState(today())

  useEffect(() => {
    setItems(getItems())
    setRecords(getStockRecords(date))
    setPL(getDailyPL(date))
  }, [date])

  const totalRevenue = pl
    ? pl.cashSales + pl.transferSales + pl.linemanSales + pl.otherSales
    : 0

  const lowStock = records.filter(r => {
    const item = items.find(i => i.id === r.itemId)
    return item && r.closingStock < item.parLevel * 0.3
  })

  const pct =
    pl && pl.targetRevenue > 0
      ? Math.min(100, Math.round((totalRevenue / pl.targetRevenue) * 100))
      : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">แดชบอร์ด</h1>
          <p className="text-xs text-slate-500">Dashboard · KPKP Lasalle</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <PLCard label="เป้าหมาย" sub="Target" value={pl?.targetRevenue ?? 0} color="blue" />
        <PLCard
          label="รายได้รวม"
          sub="Total Revenue"
          value={totalRevenue}
          color={pl && totalRevenue >= pl.targetRevenue ? 'green' : 'red'}
        />
        <PLCard label="เงินสด" sub="Cash" value={pl?.cashSales ?? 0} color="slate" />
        <PLCard label="Lineman" sub="Delivery" value={pl?.linemanSales ?? 0} color="slate" />
      </div>

      {pl && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">รายได้ vs เป้าหมาย</span>
            <span className={`font-semibold ${pct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
              {pct}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-amber-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>฿{totalRevenue.toLocaleString()}</span>
            <span>เป้า ฿{pl.targetRevenue.toLocaleString()}</span>
          </div>
        </div>
      )}

      {!pl && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
          ยังไม่มีข้อมูลรายได้สำหรับวันที่เลือก —{' '}
          <Link href="/pl" className="underline font-medium">
            บันทึกรายได้
          </Link>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-red-700 mb-2 text-sm">
            ⚠️ สต็อกต่ำกว่า 30% ของ par ({lowStock.length} รายการ)
          </h2>
          <ul className="space-y-1">
            {lowStock.map(r => {
              const item = items.find(i => i.id === r.itemId)
              return (
                <li key={r.id} className="text-sm text-red-600">
                  {item?.nameTh} — เหลือ <strong>{r.closingStock}</strong> {item?.unit}{' '}
                  <span className="text-red-400">(par: {item?.parLevel})</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction href="/daily" icon="📦" title="บันทึกสต็อกรายวัน" sub="Daily Stock Entry" />
        <QuickAction href="/pl" icon="💰" title="บันทึกรายได้" sub="Record Daily Sales" />
        <QuickAction href="/items" icon="🗂️" title="จัดการรายการสินค้า" sub="Manage Stock Items" />
      </div>
    </div>
  )
}

function PLCard({
  label,
  sub,
  value,
  color,
}: {
  label: string
  sub: string
  value: number
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-600',
    slate: 'bg-white border-slate-200 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">{label}</p>
      <p className="text-xs opacity-40 mb-1">{sub}</p>
      <p className="text-2xl font-bold">฿{value.toLocaleString()}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  sub,
}: {
  href: string
  icon: string
  title: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-4"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </Link>
  )
}
