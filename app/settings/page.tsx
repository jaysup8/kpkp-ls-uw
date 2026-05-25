'use client'
import { useState } from 'react'
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
  const [toast, setToast] = useState('')
  const [toastOk, setToastOk] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [importing, setImporting] = useState(false)

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok)
    setTimeout(() => setToast(''), 5000)
  }

  async function uploadToCloud(data: Record<string, unknown>, source: string) {
    const keys = Object.keys(data)
    if (keys.length === 0) {
      showToast(`ไม่พบข้อมูล ${source} — ไม่มีอะไรให้อัปโหลด`, false)
      return false
    }
    const result = await migrateLocalStorage(data)
    showToast(
      `✓ อัปโหลดสำเร็จ ${source} — สินค้า ${result.itemsImported} · สต็อก ${result.stockImported} · P&L ${result.plImported} · โน้ต ${result.notesImported} — กำลังรีโหลด...`
    )
    // Reload so all pages fetch fresh data from Turso
    setTimeout(() => window.location.href = '/dashboard', 1800)
    return true
  }

  async function handleMigrateToCloud() {
    setMigrating(true)
    try {
      const data = collectLocalStorage()
      await uploadToCloud(data, 'จาก Browser')
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
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>

        // Write to localStorage (fallback / legacy)
        let count = 0
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith(KPKP_KEYS_PREFIX)) {
            localStorage.setItem(key, JSON.stringify(value))
            count++
          }
        }

        // Also upload straight to cloud so it's immediately visible
        showToast(`พบ ${count} รายการ — กำลังอัปโหลดไปยัง Cloud...`)
        await uploadToCloud(data, 'จากไฟล์ Backup')
      } catch (err) {
        showToast(`ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาด: ${err}`, false)
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
              <h2 className="font-semibold text-slate-800 mb-1">อัปโหลด Browser → Cloud</h2>
              <p className="text-sm text-slate-500 mb-4">
                ย้ายข้อมูลที่มีอยู่ใน Browser นี้ไปยัง Turso Cloud<br />
                ใช้ครั้งเดียวเพื่อ sync ข้อมูลเก่าจาก localStorage
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

        {/* Import from file → auto-uploads to cloud */}
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📥</span>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">Import จากไฟล์ Backup → Cloud</h2>
              <p className="text-sm text-slate-500 mb-4">
                เลือกไฟล์ backup JSON — ระบบจะอ่านข้อมูลแล้วอัปโหลดไปยัง Cloud ทันที
              </p>
              <label className={`inline-block cursor-pointer bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                {importing ? 'กำลังนำเข้า...' : 'เลือกไฟล์ Backup (.json)'}
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📤</span>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">Export ข้อมูลจาก Browser (Backup)</h2>
              <p className="text-sm text-slate-500 mb-4">
                ดาวน์โหลดข้อมูลที่เก็บใน Browser นี้เป็นไฟล์ JSON
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

        <p className="text-xs text-slate-400 text-center pt-2">
          ข้อมูลหลักเก็บใน Turso Cloud — ทุกอุปกรณ์เห็นข้อมูลเดียวกัน
        </p>
      </div>
    </div>
  )
}
