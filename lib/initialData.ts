import type { StockItem } from './types'

export const INITIAL_ITEMS: StockItem[] = [
  // === Fresh - Makro / Freshket ===
  { id: 'f1', nameTh: 'หมูบด', nameEn: 'Ground Pork', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 8, costPerUnit: 120, active: true },
  { id: 'f2', nameTh: 'เบคอน', nameEn: 'Bacon', unit: 'pack', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 5.7, costPerUnit: 180, active: true },
  { id: 'f3', nameTh: 'หมูสับ', nameEn: 'Minced Pork', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 4, costPerUnit: 110, active: true },
  { id: 'f4', nameTh: 'หมูสับ (ชูซิ)', nameEn: 'Minced Pork (Chusi)', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 1.8, costPerUnit: 115, active: true },
  { id: 'f5', nameTh: 'ชูซิบะ', nameEn: 'Chu Siba', unit: 'pack', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 1.5, costPerUnit: 95, active: true },
  { id: 'f6', nameTh: 'หมูหยอง', nameEn: 'Pork Floss', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 1.8, costPerUnit: 200, active: true },
  { id: 'f7', nameTh: 'กุ้งหน้าวน', nameEn: 'Prawns', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 2, costPerUnit: 280, active: true },
  { id: 'f8', nameTh: 'ไข่ (35 ฟอง)', nameEn: 'Eggs (35 pcs)', unit: 'pack', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 0.3, costPerUnit: 140, active: true },
  { id: 'f9', nameTh: 'ใบกระเพาใหญ่', nameEn: 'Holy Basil', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 0.3, costPerUnit: 80, active: true },
  { id: 'f10', nameTh: 'กะปิ', nameEn: 'Shrimp Paste', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 1, costPerUnit: 60, active: true },
  { id: 'f11', nameTh: 'แตงกว่า', nameEn: 'Cucumber', unit: 'kg', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 10, costPerUnit: 30, active: true },
  { id: 'f12', nameTh: 'หัก (สด)', nameEn: 'Deduction (Fresh)', unit: 'unit', category: 'fresh', supplier: 'Makro / Freshket', parLevel: 10, costPerUnit: 0, active: true },

  // === Franchisor ===
  { id: 'fr1', nameTh: 'เครื่องเคียงสปาย', nameEn: 'Spicy Side Dish', unit: 'portion', category: 'franchisor', supplier: 'Franchisor', parLevel: 1, costPerUnit: 50, active: true },
  { id: 'fr2', nameTh: 'เบคอน (แฟรนไชส์)', nameEn: 'Bacon (Franchisor)', unit: 'pack', category: 'franchisor', supplier: 'Franchisor', parLevel: 1, costPerUnit: 180, active: true },
  { id: 'fr3', nameTh: 'หมากปลอก', nameEn: 'Peeled Items', unit: 'pack', category: 'franchisor', supplier: 'Franchisor', parLevel: 1, costPerUnit: 90, active: true },
  { id: 'fr4', nameTh: 'ไก่อก', nameEn: 'Chicken Breast', unit: 'kg', category: 'franchisor', supplier: 'Franchisor', parLevel: 1, costPerUnit: 85, active: true },
  { id: 'fr5', nameTh: 'ชุบมัน', nameEn: 'Fried Coating', unit: 'kg', category: 'franchisor', supplier: 'Franchisor', parLevel: 3, costPerUnit: 70, active: true },
  { id: 'fr6', nameTh: 'ผัก (ส่วนที่ 2)', nameEn: 'Vegetables Set 2', unit: 'portion', category: 'franchisor', supplier: 'Franchisor', parLevel: 60, costPerUnit: 5, active: true },
  { id: 'fr7', nameTh: 'ผัก (ข้าง)', nameEn: 'Side Vegetables', unit: 'portion', category: 'franchisor', supplier: 'Franchisor', parLevel: 10, costPerUnit: 3, active: true },
  { id: 'fr8', nameTh: 'กาแฟ (แฟรนไชส์)', nameEn: 'Coffee (Franchisor)', unit: 'pack', category: 'franchisor', supplier: 'Franchisor', parLevel: 10, costPerUnit: 120, active: true },
  { id: 'fr9', nameTh: 'หัก (แฟรนไชส์)', nameEn: 'Deduction (Franchisor)', unit: 'unit', category: 'franchisor', supplier: 'Franchisor', parLevel: 3, costPerUnit: 0, active: true },

  // === Dry Goods / Others ===
  { id: 'd1', nameTh: 'ค็อกเทลไส้กรอก', nameEn: 'Cocktail Sausage', unit: 'pack', category: 'dry', supplier: 'Makro / Freshket', parLevel: 3, costPerUnit: 85, active: true },
  { id: 'd2', nameTh: 'ค็อกชา', nameEn: 'Cocktail Cha', unit: 'pack', category: 'dry', supplier: 'Makro / Freshket', parLevel: 2, costPerUnit: 75, active: true },
  { id: 'd3', nameTh: 'หน่อไม้', nameEn: 'Bamboo Shoots', unit: 'kg', category: 'dry', supplier: 'Makro / Freshket', parLevel: 2, costPerUnit: 40, active: true },
  { id: 'd4', nameTh: 'น้ำมันพืช', nameEn: 'Vegetable Oil', unit: 'bottle', category: 'dry', supplier: 'Makro / Freshket', parLevel: 2, costPerUnit: 85, active: true },
  { id: 'd5', nameTh: 'แจ่วเผ็ด', nameEn: 'Spicy Sauce', unit: 'bottle', category: 'dry', supplier: 'Makro / Freshket', parLevel: 1, costPerUnit: 45, active: true },
  { id: 'd6', nameTh: 'ไสเฟล่', nameEn: 'Sausage', unit: 'pack', category: 'dry', supplier: 'Makro / Freshket', parLevel: 1, costPerUnit: 65, active: true },
  { id: 'd7', nameTh: 'ผักเครื่องปรุงถุงสำเร็จรูป', nameEn: 'Ready-made Herb Bags', unit: 'pack', category: 'dry', supplier: 'Makro / Freshket', parLevel: 2, costPerUnit: 35, active: true },
  { id: 'd8', nameTh: 'ไข่แดง', nameEn: 'Egg Yolk', unit: 'pack', category: 'dry', supplier: 'Makro / Freshket', parLevel: 1, costPerUnit: 55, active: true },
]
