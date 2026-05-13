import type { Branch } from './types'

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์']
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

type OrderItem = {
  itemId: string
  display: string
  unit: string
  suffix?: string
}

type OrderSection = {
  header?: string
  items: OrderItem[]
}

const LASALLE_SECTIONS: OrderSection[] = [
  {
    items: [
      { itemId: 'r1',  display: 'มันหมู',                         unit: 'โล',  suffix: 'แบ่งถุงละ 2' },
      { itemId: 'r2',  display: 'หมูสับ',                         unit: 'โล',  suffix: 'แบ่งถุงละ 2' },
      { itemId: 'r3',  display: 'สามชั้น',                        unit: 'โล' },
      { itemId: 'r4',  display: 'สันคอหมู',                       unit: 'โล' },
      { itemId: 'r5',  display: 'สะโพกหมู',                      unit: 'โล' },
    ],
  },
  {
    header: 'ร้านไก่',
    items: [
      { itemId: 'r6',  display: 'สันในไก่',                       unit: 'โล' },
      { itemId: 'r7',  display: 'เนื้อน่องไก่ใหญ่',               unit: 'โล' },
    ],
  },
  {
    header: 'ร้านทะเล',
    items: [
      { itemId: 'r8',  display: 'กุ้ง',                           unit: 'โล' },
      { itemId: 'r9',  display: 'หมึก',                           unit: 'โล' },
    ],
  },
  {
    header: 'ร้านผัก',
    items: [
      { itemId: 'r10', display: 'ใบกะเพราขาวใบกลาง',             unit: 'โล' },
      { itemId: 'r11', display: 'กะหล่ำปลี',                     unit: 'หัว' },
      { itemId: 'r12', display: 'ต้นหอม',                        unit: 'บาท' },
      { itemId: 'r13', display: 'แตงกวา',                        unit: 'บาท' },
      { itemId: 'r15', display: 'มะเขือเทศ',                     unit: 'ลูก' },
      { itemId: 'r16', display: 'มะนาว',                         unit: 'ลูก' },
      { itemId: 'r17', display: 'หอมใหญ่',                       unit: 'หัว' },
      { itemId: 'fk3', display: 'กระเทียมจีนปอกเปลือก',         unit: 'โล' },
      { itemId: 'fk4', display: 'พริกขี้หนูสวนเด็ดก้าน',        unit: 'โล' },
    ],
  },
]

const UDOMSUK_SECTIONS: OrderSection[] = [
  {
    items: [
      { itemId: 'r1',  display: 'มันหมู',                         unit: 'โล',  suffix: 'แบ่งถุงละ 2' },
      { itemId: 'r2',  display: 'หมูสับ',                         unit: 'โล',  suffix: 'แบ่งถุงละ 2' },
      { itemId: 'r3',  display: 'สามชั้น',                        unit: 'โล' },
      { itemId: 'r4',  display: 'สันคอหมู',                       unit: 'โล' },
      { itemId: 'r5',  display: 'สะโพกหมู',                      unit: 'โล' },
    ],
  },
  {
    header: 'ร้านไก่',
    items: [
      { itemId: 'r6',  display: 'สันในไก่',                       unit: 'โล' },
      { itemId: 'r7',  display: 'เนื้อน่องไก่ใหญ่',               unit: 'โล' },
    ],
  },
  {
    header: 'ร้านทะเล',
    items: [
      { itemId: 'r8',  display: 'กุ้ง',                           unit: 'โล' },
      { itemId: 'r9',  display: 'หมึก',                           unit: 'โล' },
      { itemId: 'r21', display: 'หมึกกรอบ',                      unit: 'โล' },
    ],
  },
  {
    header: 'ร้านผัก',
    items: [
      { itemId: 'r10', display: 'ใบกะเพราขาวใบกลาง',             unit: 'โล' },
      { itemId: 'r11', display: 'กะหล่ำปลี',                     unit: 'หัว' },
      { itemId: 'r12', display: 'ต้นหอม',                        unit: 'บาท' },
      { itemId: 'r13', display: 'แตงกวา',                        unit: 'บาท' },
      { itemId: 'r16', display: 'มะนาว',                         unit: 'ลูก' },
      { itemId: 'r20', display: 'ผักกาดหอม',                     unit: 'โล' },
      { itemId: 'r19', display: 'พริกแดงจินดา',                  unit: 'บาท' },
      { itemId: 'fk3', display: 'กระเทียมจีนปอกเปลือก',         unit: 'โล' },
      { itemId: 'fk4', display: 'พริกขี้หนูสวนเด็ดก้าน',        unit: 'โล' },
      { itemId: 'r22', display: 'เส้นก๋วยเตี๋ยว(เส้นใหญ่)เอาไว้ทำคั่วไก่', unit: 'โล' },
    ],
  },
]

function fmt(amount: number): string {
  if (amount === 0) return '-'
  return amount % 1 === 0 ? String(amount) : String(amount)
}

export function generateOrderText(
  selectedDate: string,
  branch: Branch,
  orderMap: Record<string, number>,
): string {
  // Delivery = next day after the stock count date
  const d = new Date(selectedDate)
  d.setDate(d.getDate() + 1)

  const dayName = THAI_DAYS[d.getDay()]
  const day = d.getDate()
  const month = THAI_MONTHS[d.getMonth()]

  let time: string
  if (branch === 'lasalle') {
    const dow = d.getDay()
    time = (dow === 0 || dow === 6) ? '8:00' : '6:00'
  } else {
    time = '8:30'
  }

  const branchName = branch === 'lasalle' ? 'สาขาลาซาล' : 'สาขาอุดมสุข วอร์ค'
  const sections = branch === 'lasalle' ? LASALLE_SECTIONS : UDOMSUK_SECTIONS

  const lines: string[] = [
    branchName,
    `${dayName} ${day} ${month} ส่ง ${time}**`,
    '',
  ]

  for (const section of sections) {
    if (section.header) lines.push(section.header)
    for (const item of section.items) {
      const amount = fmt(orderMap[item.itemId] ?? 0)
      const suffix = item.suffix ? ` ${item.suffix}` : ''
      lines.push(`-${item.display} ${amount} ${item.unit}${suffix}`)
    }
    lines.push('')
  }

  lines.push('ส่งที่เดิม ถังน้ำแข็งสีน้ำเงิน')
  return lines.join('\n')
}
