export type POStatus = 'Draft' | 'In Review' | 'Processing' | 'Confirmed' | 'Delivered' | 'Invoiced' | 'Paid' | 'Cancelled'

export type POLineItem = {
  vendorId: string
  productId: string
  quantity: number
  unit: 'units' | 'cases'
  unitPrice: number
  deliveryFee?: number
  deliverySchedule?: string
  orderNote?: string
}

export type PurchaseOrder = {
  id: string
  dateRange: { start: string; end: string } | null
  status: POStatus
  total: number
  cureatorName: string
  lineItems: POLineItem[]
  createdAt: string
  deliveryDate: string | null
  deliveryDateShort: string | null
}

// Seed data — never mutated
const _purchaseOrdersSeed: PurchaseOrder[] = [
  {
    id: '004-CHARLES-00017',
    dateRange: { start: '04/01/2026', end: '04/15/2026' },
    status: 'In Review',
    total: 650.56,
    cureatorName: 'Cureate DMV',
    createdAt: '2026-04-01',
    deliveryDate: '2026-04-22',
    deliveryDateShort: 'Apr 22',
    lineItems: [
      {
        vendorId: '2betties',
        productId: '16820',
        quantity: 2,
        unit: 'cases',
        unitPrice: 68.20,
        deliveryFee: 0,
        deliverySchedule: 'Next delivery: 04/15/2026',
        orderNote: 'Please deliver week of 4/15. Thank you!'
      },
      {
        vendorId: '2betties',
        productId: '16821',
        quantity: 1,
        unit: 'cases',
        unitPrice: 68.20,
        deliverySchedule: 'Next delivery: 04/15/2026',
        orderNote: 'Please deliver week of 4/15. Thank you!'
      },
      {
        vendorId: 'ethiopian-delights',
        productId: '10616',
        quantity: 3,
        unit: 'cases',
        unitPrice: 75.48,
        deliverySchedule: 'Next delivery: 04/15/2026',
        orderNote: 'Self-distribute — call ahead please.'
      }
    ]
  },
  {
    id: '005-BRENDA-00098',
    dateRange: { start: '03/22/2026', end: '03/28/2026' },
    status: 'Confirmed',
    total: 274.00,
    cureatorName: 'Cureate DMV',
    createdAt: '2026-03-22',
    deliveryDate: '2026-03-25',
    deliveryDateShort: 'Mar 25',
    lineItems: [
      {
        vendorId: 'open-seas-coffee-roasters',
        productId: '16523',
        quantity: 7,
        unit: 'cases',
        unitPrice: 39.00,
        deliverySchedule: 'Next delivery: 03/28/2026',
      }
    ]
  },
  {
    id: '006-STEPH-00001',
    dateRange: { start: '03/15/2026', end: '03/21/2026' },
    status: 'Delivered',
    total: 889.00,
    cureatorName: 'Cureate DMV',
    createdAt: '2026-03-15',
    deliveryDate: '2026-03-18',
    deliveryDateShort: 'Mar 18',
    lineItems: [
      {
        vendorId: '2betties',
        productId: '16822',
        quantity: 5,
        unit: 'cases',
        unitPrice: 68.20,
        deliverySchedule: 'Delivered 03/21/2026',
      },
      {
        vendorId: 'ethiopian-delights',
        productId: '10617',
        quantity: 4,
        unit: 'cases',
        unitPrice: 75.48,
        deliverySchedule: 'Delivered 03/21/2026',
      }
    ]
  },
  {
    id: '007-MARKET-00001',
    dateRange: null,
    status: 'Draft',
    total: 29.68,
    cureatorName: 'Cureate DMV',
    createdAt: '2026-04-10',
    deliveryDate: '2026-04-29',
    deliveryDateShort: 'Apr 29',
    lineItems: [
      {
        vendorId: '2betties',
        productId: '16823',
        quantity: 1,
        unit: 'cases',
        unitPrice: 68.20,
      }
    ]
  },
  {
    id: '003-CHARLES-00014',
    dateRange: { start: '02/10/2026', end: '02/24/2026' },
    status: 'Cancelled',
    total: 412.00,
    cureatorName: 'Cureate DMV',
    createdAt: '2026-02-10',
    deliveryDate: null,
    deliveryDateShort: null,
    lineItems: []
  }
]

// Mutable working copy — this is the live state
export let purchaseOrders: PurchaseOrder[] = JSON.parse(JSON.stringify(_purchaseOrdersSeed))

// Update a Draft PO's line items — replaces the object to avoid mutating in place
export function updateDraftPOLineItems(poId: string, lineItems: POLineItem[]): void {
  const idx = purchaseOrders.findIndex(p => p.id === poId)
  if (idx === -1 || purchaseOrders[idx].status !== 'Draft') return
  purchaseOrders[idx] = { ...purchaseOrders[idx], lineItems }
}

// Reset to seed data (useful for dev)
export function resetPurchaseOrders(): void {
  purchaseOrders = JSON.parse(JSON.stringify(_purchaseOrdersSeed))
}

// Auto-generate a new PO ID
export function generateNewPOId(): string {
  const existing = purchaseOrders.filter(po => po.id.startsWith('00')).length
  const num = String(existing + 1).padStart(3, '0')
  return `${num}-MARKET-${String(Date.now()).slice(-5)}`
}

// Add a new Draft PO to the live array
export function addNewDraftPO(id: string, deliveryDate: string): void {
  const [y, m, d] = deliveryDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const deliveryDateShort = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  purchaseOrders.push({
    id,
    dateRange: null,
    status: 'Draft',
    total: 0,
    cureatorName: 'Cureate DMV',
    createdAt: new Date().toISOString().split('T')[0],
    deliveryDate,
    deliveryDateShort,
    lineItems: [],
  })
}
