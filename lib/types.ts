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
  parLevels: Record<Branch, number>  // per-branch par levels
  costPerUnit: number
  active: boolean
  branches?: Branch[]  // undefined = all branches; set to restrict to specific branches
  autoOrder?: boolean  // true = To Order auto-computes as par - closing; false = manual entry
  sortOrder?: number   // display order within category; lower = higher in list
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
  ordered?: boolean   // user has checked "ordered" — already requested from supplier
  notes?: string
}

export interface OtherExpense {
  description: string
  amount: number
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

  // ---- Expenses (optional for backwards compat) ----
  freshMarketExpense?: number    // ตลาดสด
  freshketExpense?: number       // Freshket
  makroExpense?: number          // Makro
  franchisorExpense?: number     // ส่งจากแฟรนไชส์
  otherExpenses?: OtherExpense[] // อื่นๆ (รายการละบรรทัด)

  notes?: string
}
