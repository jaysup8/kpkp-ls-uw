'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSelectedBranch } from '@/lib/storage'
import type { Branch } from '@/lib/types'

const BRANCH_STYLE: Record<Branch, { bg: string; badge: string; name: string }> = {
  lasalle:  { bg: 'bg-blue-700',    badge: 'bg-blue-500',    name: 'KPKP Lasalle' },
  udomsuk:  { bg: 'bg-emerald-700', badge: 'bg-emerald-500', name: 'KPKP Udomsuk' },
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'แดชบอร์ด' },
  { href: '/daily',     label: 'บันทึกสต็อก' },
  { href: '/pl',        label: 'รายได้ / P&L' },
  { href: '/items',     label: 'จัดการรายการ' },
]

export default function Navbar() {
  const path = usePathname()
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)

  useEffect(() => {
    setBranch(getSelectedBranch())
  }, [path])

  const style = branch ? BRANCH_STYLE[branch] : null

  return (
    <nav className={`${style ? style.bg : 'bg-slate-800'} text-white shadow-md transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg shrink-0">
          🍽️ KPKP
        </Link>

        {branch && style ? (
          <>
            {/* Branch badge + switch */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-lg text-sm shrink-0"
              title="เปลี่ยนสาขา"
            >
              <span className={`w-2 h-2 rounded-full ${style.badge}`} />
              <span className="font-semibold">{style.name}</span>
              <span className="text-white/50 text-xs hidden sm:inline">เปลี่ยน ↗</span>
            </button>

            {/* Nav links */}
            <div className="flex items-center gap-0.5 ml-2">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    path === l.href
                      ? 'bg-white/20 font-semibold'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <span className="text-white/50 text-sm">กรุณาเลือกสาขา</span>
        )}
      </div>
    </nav>
  )
}
