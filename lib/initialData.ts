import type { StockItem } from './types'

function item(
  id: string, nameTh: string, nameEn: string, unit: string,
  category: StockItem['category'], supplier: string,
  lasallePar: number, udomsukPar: number,
  opts?: Partial<Pick<StockItem, 'branches' | 'active' | 'costPerUnit' | 'autoOrder'>>
): StockItem {
  // Default: only Raw Food items auto-compute To Order = par - closing.
  // Other categories require manual To Order entry.
  const autoOrder = opts?.autoOrder ?? (category === 'raw')
  return {
    id, nameTh, nameEn, unit, category, supplier,
    parLevels: { lasalle: lasallePar, udomsuk: udomsukPar },
    costPerUnit: opts?.costPerUnit ?? 0,
    active: opts?.active ?? true,
    autoOrder,
    ...(opts?.branches ? { branches: opts.branches } : {}),
  }
}

const R = 'raw', FK = 'freshket', FR = 'franchisor', DR = 'drinks', ET = 'etc'
const MKT = '-', FKS = 'Freshket / Makro', FRS = 'Franchisor'

export const INITIAL_ITEMS: StockItem[] = [
  // === Raw Food ===
  item('r1',  'มันหมู',       'Pork Fat',              'kg',     R, MKT, 0, 0),
  item('r2',  'หมูสับ',       'Minced Pork',           'kg',     R, MKT, 0, 0),
  item('r3',  'หมูสามชั้น',   'Pork Belly',            'kg',     R, MKT, 0, 0),
  item('r4',  'สันคอหมู',     'Pork Neck',             'kg',     R, MKT, 0, 0),
  item('r5',  'สะโพกหมู',     'Pork Leg',              'kg',     R, MKT, 0, 0),
  item('r6',  'สันในไก่',     'Chicken Tenderloin',    'kg',     R, MKT, 0, 0),
  item('r7',  'เนื้อน่องไก่', 'Chicken Drumstick',     'kg',     R, MKT, 0, 0),
  item('r8',  'กุ้ง',         'Shrimp',                'kg',     R, MKT, 0, 0),
  item('r9',  'หมึกกล้วย',    'Baby Squid',            'kg',     R, MKT, 0, 0),
  item('r10', 'ใบกะเพราขาว',  'White Holy Basil',      'kg',     R, MKT, 0, 0),
  item('r11', 'กะหล่ำปลี',    'Cabbage',               'kg',     R, MKT, 0, 0),
  item('r12', 'ต้นหอม',       'Spring Onion',          'kg',     R, MKT, 0, 0),
  item('r13', 'แตงกวา',       'Cucumber',              'kg',     R, MKT, 0, 0),
  item('r14', 'ผักชี',        'Coriander',             'kg',     R, MKT, 0, 0),
  item('r15', 'มะเขือเทศ',    'Tomato',                'kg',     R, MKT, 0, 0),
  item('r16', 'มะนาว',        'Lime',                  'kg',     R, MKT, 0, 0),
  item('r17', 'หอมใหญ่',      'Onion',                 'kg',     R, MKT, 0, 0),
  item('r18', 'มะเขือ',       'Eggplant',              'kg',     R, MKT, 0, 0),
  item('r19', 'พริกแดงจินดา', 'Red Chili',             'kg',     R, MKT, 0, 0, { branches: ['udomsuk'] }),
  item('r20', 'ผักกาดหอม',    'Lettuce',               'kg',     R, MKT, 0, 0, { branches: ['udomsuk'] }),
  item('r21', 'หมึกกรอบ',     'Crispy Squid',          'kg',     R, MKT, 0, 0, { branches: ['udomsuk'] }),
  item('r22', 'เส้นใหญ่',     'Wide Rice Noodle',      'kg',     R, MKT, 0, 0, { branches: ['udomsuk'] }),

  // === Freshket / Makro ===
  item('fk1',  'เบคอน',              'Bacon',                  'pack',   FK, FKS, 0, 0),
  item('fk2',  'ไส้กรอก',            'Sausage',                'pack',   FK, FKS, 0, 0),
  item('fk3',  'กระเทียม',           'Garlic',                 'kg',     FK, FKS, 0, 0),
  item('fk4',  'พริกขี้หนูสวน',     "Bird's Eye Chili",       'kg',     FK, FKS, 0, 0),
  item('fk5',  'ไข่ไก่',             'Chicken Egg',            'flat',   FK, FKS, 0, 0),
  item('fk6',  'ไข่เป็ด',            'Duck Egg',               'flat',   FK, FKS, 0, 0),
  item('fk7',  'ไข่เยี่ยวม้า',       'Century Egg',            'pack',   FK, FKS, 0, 0),
  item('fk8',  'มาม่า',              'Instant Noodles',        'pack',   FK, FKS, 0, 0),
  item('fk9',  'ซอสวิกกี้เขียว',    'Wigi Green Sauce',       'bottle', FK, FKS, 0, 0),
  item('fk10', 'ซีอิ๋วหวาน',        'Sweet Soy Sauce',        'bottle', FK, FKS, 0, 0),
  item('fk11', 'ซอสแม๊กกี้',        'Maggi Sauce',            'bottle', FK, FKS, 0, 0),
  item('fk12', 'น้ำปลาตราชั่ง',     'Fish Sauce (Tra Chang)', 'bottle', FK, FKS, 0, 0),
  item('fk13', 'ผงชูรส',            'MSG',                    'pack',   FK, FKS, 0, 0),
  item('fk14', 'พริกไทยป่น',        'Ground Pepper',          'pack',   FK, FKS, 0, 0),
  item('fk15', 'ซอสพริก',           'Chili Sauce',            'bottle', FK, FKS, 0, 0),
  item('fk16', 'ซอสมะเขือเทศ',      'Tomato Sauce',           'bottle', FK, FKS, 0, 0),
  item('fk17', 'แป้ง savepak',      'Savepak Flour',          'pack',   FK, FKS, 0, 0),
  item('fk18', 'ซอสฟ้าไทย',         'Fah Thai Sauce',         'bottle', FK, FKS, 0, 0),
  item('fk19', 'พริกน้ำปลา aro',    'Aro Chili Fish Sauce',   'bottle', FK, FKS, 0, 0),

  // === Franchisor ===
  item('fr1', 'เนื้อบด',          'Ground Beef',        'kg',     FR, FRS, 0, 0),
  item('fr2', 'เนื้อแองกัสบด',    'Angus Ground Beef',  'kg',     FR, FRS, 0, 0),
  item('fr3', 'หมูยอ',            'Pork Sausage Roll',  'pack',   FR, FRS, 0, 0),
  item('fr4', 'กุนเชียง',         'Chinese Sausage',    'pack',   FR, FRS, 0, 0),
  item('fr5', 'หน่อไม้',          'Bamboo Shoots',      'kg',     FR, FRS, 0, 0),
  item('fr6', 'พริกแห้ง',         'Dried Chili',        'kg',     FR, FRS, 0, 0),
  item('fr7', 'น้ำซอสผัด',        'Stir-fry Sauce',     'bottle', FR, FRS, 0, 0),
  item('fr8', 'กระดาษรองจาน',    'Plate Liner Paper',  'pack',   FR, FRS, 0, 0),

  // === Drinks ===
  item('d1',  'น้ำเปล่า',         'Water',              'pack',   DR, MKT, 0, 0),
  item('d2',  'โค้ก',             'Coke',               'bottle', DR, MKT, 0, 0),
  item('d3',  'โค้กซีโร่',        'Coke Zero',          'bottle', DR, MKT, 0, 0),
  item('d4',  'โค้กแคน',          'Coke Can',           'can',    DR, MKT, 0, 0),
  item('d5',  'น้ำเขียว',         'Green Soda',         'bottle', DR, MKT, 0, 0),
  item('d6',  'น้ำแดง',           'Red Soda',           'bottle', DR, MKT, 0, 0),
  item('d7',  'น้ำส้ม',           'Orange Juice',       'bottle', DR, MKT, 0, 0),
  item('d8',  'สไปร์ท',           'Sprite',             'bottle', DR, MKT, 0, 0),
  item('d9',  'น้ำส้มสแปลช',      'Splash Orange',      'bottle', DR, MKT, 0, 0),
  item('d10', 'ชเวปส์กระป๋อง',   'Schweppes Can',      'can',    DR, MKT, 0, 0),

  // === ETC ===
  item('e1',  'ข้าวสาร',          'Rice',               'kg',     ET, MKT, 0, 0),
  item('e2',  'กระทะ',            'Pan / Wok',          'piece',  ET, MKT, 0, 0),
  item('e3',  'กระดาษร้อน',      'Wax Paper',          'roll',   ET, MKT, 0, 0),
  item('e4',  'ทิชชูม้วน',       'Toilet Roll',        'roll',   ET, MKT, 0, 0),
  item('e5',  'ทิชชูลูกค้า',    'Customer Tissue',    'pack',   ET, MKT, 0, 0),
  item('e6',  'ถุง 8x16',        'Bag 8x16',           'pack',   ET, MKT, 0, 0),
  item('e7',  'น้ำยาล้างจาน',    'Dish Soap',          'bottle', ET, MKT, 0, 0),
  item('e8',  'น้ำยาถูพื้น',     'Floor Cleaner',      'bottle', ET, MKT, 0, 0),
  item('e9',  'น้ำยาล้างห้องน้ำ', 'Toilet Cleaner',    'bottle', ET, MKT, 0, 0),
  item('e10', 'ผงซักฟอก',        'Detergent Powder',   'pack',   ET, MKT, 0, 0),
  item('e11', 'แก้วน้ำ',         'Water Glass',        'piece',  ET, MKT, 0, 0),
  item('e12', 'หลอด',            'Straw',              'pack',   ET, MKT, 0, 0),
  item('e13', 'กล่องขาวแบบ 2 ช่อง', 'White Box 2-section', 'pack', ET, MKT, 0, 0),
  item('e14', 'กล่องข้าวแบบ 1 ช่อง', 'Rice Box 1-section', 'pack', ET, MKT, 0, 0),
  item('e15', 'ช้อนส้อม',        'Fork & Spoon',       'pack',   ET, MKT, 0, 0),
]
