'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  { href: '/settings',  label: '⚙️ ตั้งค่า' },
]

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function Navbar() {
  const path = usePathname()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setBranch(getSelectedBranch())
    setMenuOpen(false)
  }, [path])

  const style = branch ? BRANCH_STYLE[branch] : null

  async function handleLogout() {
    setMenuOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <nav className={`${style ? style.bg : 'bg-slate-800'} text-white shadow-md transition-colors duration-300 relative z-40`}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg shrink-0" onClick={() => setMenuOpen(false)}>
          🍽️ KPKP
        </Link>

        {branch && style ? (
          <>
            {/* Branch badge + switch */}
            <button
              onClick={() => { setMenuOpen(false); router.push('/') }}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-lg text-sm shrink-0"
              title="เปลี่ยนสาขา"
            >
              <span className={`w-2 h-2 rounded-full ${style.badge}`} />
              <span className="font-semibold">{style.name}</span>
              <span className="text-white/50 text-xs hidden sm:inline">เปลี่ยน ↗</span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5 ml-2">
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

            {/* Desktop logout button */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 ml-auto text-white/70 hover:text-white hover:bg-white/10 transition-colors px-3 py-1.5 rounded-lg text-sm shrink-0"
              title="ออกจากระบบ"
            >
              <LogoutIcon />
              <span>ออกจากระบบ</span>
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-auto p-2 rounded-lg hover:bg-white/15 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="เมนู"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="17" y2="17"/><line x1="17" y1="5" x2="5" y2="17"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="19" y2="6"/>
                  <line x1="3" y1="11" x2="19" y2="11"/>
                  <line x1="3" y1="16" x2="19" y2="16"/>
                </svg>
              )}
            </button>
          </>
        ) : (
          <>
            <span className="text-white/50 text-sm">กรุณาเลือกสาขา</span>
            {/* Logout even when no branch selected */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 ml-auto text-white/70 hover:text-white hover:bg-white/10 transition-colors px-3 py-1.5 rounded-lg text-sm shrink-0"
              title="ออกจากระบบ"
            >
              <LogoutIcon />
              <span>ออกจากระบบ</span>
            </button>
            {/* Mobile hamburger for no-branch state */}
            <button
              className="md:hidden ml-auto p-2 rounded-lg hover:bg-white/15 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="เมนู"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="17" y2="17"/><line x1="17" y1="5" x2="5" y2="17"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="19" y2="6"/>
                  <line x1="3" y1="11" x2="19" y2="11"/>
                  <line x1="3" y1="16" x2="19" y2="16"/>
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 top-14 bg-black/30 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className={`md:hidden absolute top-full left-0 right-0 z-40 ${style ? style.bg : 'bg-slate-800'} border-t border-white/10 shadow-2xl`}>
            {branch && style && NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center px-5 py-4 text-base border-b border-white/10 transition-colors ${
                  path === l.href
                    ? 'bg-white/20 font-semibold'
                    : 'text-white/85 hover:bg-white/10'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-5 py-4 text-base text-white/75 hover:bg-white/10 transition-colors"
            >
              <LogoutIcon />
              ออกจากระบบ
            </button>
          </div>
        </>
      )}
    </nav>
  )
}
