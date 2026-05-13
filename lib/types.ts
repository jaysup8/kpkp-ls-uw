export type Category = 'raw' | 'freshket' | 'franchisor' | 'drinks' | 'etc'

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
  itemId: string
  openingStock: number
  received: number
  used: number
  closingStock: number
  notes?: string
}

export interface DailyPL {
  date: string
  targetRevenue: number
  cashSales: number
  transferSales: number
  linemanSales: number
  otherSales: number
  notes?: string
}
