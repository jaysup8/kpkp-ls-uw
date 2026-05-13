export type Category = 'raw' | 'freshket' | 'franchisor' | 'drinks' | 'etc'
export type Branch = 'lasalle' | 'udomsuk'

export const BRANCH_NAMES: Record<Branch, string> = {
  lasalle: 'KPKP Lasalle',
  udomsuk: 'KPKP Udomsuk',
}

export interface StockItem {
  id: string
  nameTh: string
  nameEn: string
  unit: string
  category: Category
  supplier: string
  parLevel: number
  costPerUnit: number
  active: boolean
}

export interface DailyStockRecord {
  id: string
  date: string
  branch: Branch
  itemId: string
  openingStock: number
  received: number
  used: number
  closingStock: number
  notes?: string
}

export interface DailyPL {
  date: string
  branch: Branch
  targetRevenue: number
  cashSales: number        // เงินสด
  transferTotal: number    // เงินโอน (รวม Grab + Robinhood + Shopee)
  linemanSales: number     // Lineman
  grabSales: number        // Grab
  robinhoodSales: number   // Robinhood
  shopeeSales: number      // Shopee
  // auto: เงินโอนแม่มณี = transferTotal - grabSales - robinhoodSales - shopeeSales
  // auto: total = cashSales + เงินโอนแม่มณี + linemanSales + grabSales + robinhoodSales + shopeeSales
  notes?: string
}
