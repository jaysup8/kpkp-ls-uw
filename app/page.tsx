'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { setSelectedBranch } from '@/lib/storage'
import type { Branch } from '@/lib/types'

const BRANCHES: {
  id: Branch
  name: string
  nameTh: string
  color: 'blue' | 'emerald'
}[] = [
  { id: 'lasalle',  name: 'KPKP Lasalle',  nameTh: 'สาขาลาซาล',  color: 'blue' },
  { id: 'udomsuk',  name: 'KPKP Udomsuk',  nameTh: 'สาขาอุดมสุข', color: 'emerald' },
]

const COLOR = {
  blue: {
    card:    'border-blue-200 hover:border-blue-400 hover:shadow-blue-100/60',
    icon:    'bg-blue-100 text-blue-600',
    title:   'text-blue-700',
    sub:     'text-blue-500',
    btn:     'bg-blue-600 hover:bg-blue-700 text-white',
    dot:     'bg-blue-500',
  },
  emerald: {
    card:    'border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100/60',
    icon:    'bg-emerald-100 text-emerald-600',
    title:   'text-emerald-700',
    sub:     'text-emerald-500',
    btn:     'bg-emerald-600 hover:bg-emerald-700 text-white',
    dot:     'bg-emerald-500',
  },
}

export default function BranchSelectPage() {
  const router = useRouter()

  function select(branch: Branch) {
    setSelectedBranch(branch)
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[76vh]">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <Image
            src="/icon-512.png"
            alt="ก็เพราะ กะเพรา Thai Basil"
            width={140}
            height={140}
            className="rounded-full shadow-lg"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">ก็เพราะ กะเพรา</h1>
        <p className="text-slate-500 mt-1 text-base">Thai Basil · KPKP Restaurant</p>
        <p className="text-slate-400 mt-3 text-lg">กรุณาเลือกสาขา · Select Branch</p>
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
        {BRANCHES.map(b => {
          const c = COLOR[b.color]
          return (
            <button
              key={b.id}
              onClick={() => select(b.id)}
              className={`bg-white rounded-2xl border-2 p-8 text-left hover:shadow-xl transition-all duration-200 cursor-pointer group ${c.card}`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 overflow-hidden ${c.icon}`}>
                <Image
                  src="/icon-512.png"
                  alt="logo"
                  width={56}
                  height={56}
                  className="rounded-xl"
                />
              </div>

              {/* Name */}
              <h2 className={`text-2xl font-bold mb-1 ${c.title}`}>{b.name}</h2>
              <p className={`text-sm font-medium mb-6 ${c.sub}`}>{b.nameTh}</p>

              {/* CTA */}
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.btn}`}>
                เข้าสู่ระบบสาขา
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-slate-400 text-xs mt-10">
        ข้อมูลสต็อกและรายได้แยกตามสาขา · Stock and P&L data is separated per branch
      </p>
    </div>
  )
}
