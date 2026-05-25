'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { migrateLocalStorage } from '@/lib/api'

const KPKP_KEYS_PREFIX = 'kpkp_'

function collectLocalStorage(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(KPKP_KEYS_PREFIX)) {
      try { data[key] = JSON.parse(localStorage.getItem(key)!) }
      catch { data[key] = localStorage.getItem(key) }
    }
  }
  return data
}

function exportData() {
  const data = collectLocalStorage()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kpkp-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const router = useRouter()
  const [toast, setToast] = useState('')
  const [toastOk, setToastOk] = useState(true)
  const [importing, setImporting] = useState(false)
  const [migrating, setMigrating] = useState(false)

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleMigrateToCloud() {
    setMigrating(true)
    try {
      const data = collectLocalStorage()
      const keys = Object.keys(data)
      if (keys.length === 0) {
        showToast('ไม่พบข้อมูลใน localStorage', false)
        return
      }
      const result = await migrateLocalStorage(data)
      showToast(
        `✓ อัปโหลดสำเร็จ — สินค้า ${result.itemsImported} รายการ · สต็อก ${result.stockImported} · P&L ${result.plImported} · โน้ต ${result.notesImported}`
      )
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err}`, false)
    } finally {
      setMigrating(false)
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>
        let count = 0
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith(KPKP_KEYS_PREFIX)) {
            localStorage.setItem(key, JSON.stringify(value))
            count++
          }
        }
        showToast(`นำเข้าสำเร็จ ${count} รายการ ✓`)
        setTimeout(() => router.push('/dashboard'), 1500)
      } catch {
        showToast('ไฟล์ไม่ถูกต้อง — กรุณาใช้ไฟล์ backup จากระบบนี้เท่านั้น', false)
      } finally {
        setImporting(false)
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ตั้งค่า / Settings</h1>
        <p className="text-xs text-slate-400 mt-1">จัดการข้อมูลและการซิงค์กับ Cloud</p>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${!toastOk ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast}
        </div>
      )}

      <div className="space-y-4">

        {/* Cloud Migration */}
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">☁️</span>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">อัปโหลดไปยัง Cloud</h2>
              <p className="text-sm text-slate-500 mb-4">
                ย้ายข้อมูลจาก Browser ไปยัง Turso Database เพื่อใช้งานบนทุกอุปกรณ์<br />
                <span className="text-blue-600 font-medium">ข้อมูลเดิมบน Cloud จะถูกอัปเดต (ไม่ถูกลบ)</span>
              </p>
              <button
                onClick={handleMigrateToCloud}
                disabled={migrating}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {migrating ? 'กำลังอัปโหลด...' : 'อัปโหลดข้อมูลไปยัง Cloud'}
              </button>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📤</span>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">Export ข้อมูล (Backup)</h2>
              <p className="text-sm text-slate-500 mb-4">
                ดาวน์โหลดข้อมูลทั้งหมดจาก Browser เป็นไฟล์ JSON
              </p>
              <button
                onClick={exportData}
                className="bg-slate-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                ดาวน์โหลดไฟล์ Backup
              </button>
            </div>
          </div>
        </div>

        {/* Import */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📥</span>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">Import จากไฟล์ Backup</h2>
              <p className="text-sm text-slate-500 mb-4">
                อัปโหลดไฟล์ backup เพื่อนำเข้าข้อมูลไปยัง Browser<br />
                <span className="text-amber-600 font-medium">⚠️ ข้อมูลปัจจุบันใน Browser จะถูกแทนที่</span>
              </p>
              <label className={`inline-block cursor-pointer bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                {importing ? 'กำลังนำเข้า...' : 'เลือกไฟล์ Backup'}
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          ข้อมูลหลักเก็บใน Turso Cloud Database — ทุกอุปกรณ์จะเห็นข้อมูลเดียวกัน
        </p>
      </div>
    </div>
  )
}
