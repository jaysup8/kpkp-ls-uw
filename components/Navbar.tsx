'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'แดชบอร์ด', en: 'Dashboard' },
  { href: '/daily', label: 'บันทึกสต็อก', en: 'Daily Stock' },
  { href: '/pl', label: 'รายได้/P&L', en: 'P&L' },
  { href: '/items', label: 'จัดการรายการ', en: 'Items' },
]

export default function Navbar() {
  const path = usePathname()
  return (
    <nav className="bg-slate-800 text-white px-6 py-3 flex items-center gap-6 shadow-md">
      <div className="font-bold text-base mr-2 flex items-center gap-2">
        <span>🍽️</span>
        <span>KPKP Stock</span>
      </div>
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm transition-colors hover:text-yellow-300 ${
            path === l.href ? 'text-yellow-300 font-semibold' : 'text-slate-300'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
