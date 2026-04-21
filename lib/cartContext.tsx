'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { vendors } from './data'
import {
  purchaseOrders,
  updateDraftPOLineItems,
  addNewDraftPO as addNewDraftPOData,
  generateNewPOId as generateNewPOIdData,
  POLineItem,
} from './purchaseOrdersData'

type CartItem = {
  productId: string
  vendorId: string
  quantity: number
  unit: 'units' | 'cases'
}

type CartContextType = {
  items: CartItem[]
  addItem: (vendorId: string, productId: string, quantity: number, unit: 'units' | 'cases') => void
  removeItem: (vendorId: string, productId: string) => void
  clearItems: () => void
  clearStagedItems: () => void
  getTotalUnits: (vendorId: string) => number
  getTotalItems: () => number
  getMinUnitsRequired: (vendorId: string) => number
  isMinMet: (vendorId: string) => boolean
  selectedPOId: string
  setSelectedPOId: (id: string) => void
  hasActivePO: boolean
  purchaseOrders: { id: string; label: string }[]
  addPurchaseOrder: (id: string) => void
  isDrawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  isActivePODraft: boolean
  selectedDeliveryWeek: string
  setSelectedDeliveryWeek: (date: string) => void
  repeatMode: 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
  setRepeatMode: (mode: 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom') => void
  customEndType: 'never' | 'date' | 'after'
  setCustomEndType: (type: 'never' | 'date' | 'after') => void
  syncItemsFromPO: (poId: string) => void
  mergeStagedItemsIntoPO: (poId: string) => void
  addNewDraftPO: (id: string, deliveryDate: string) => void
  generateNewPOId: () => string
}

function getNextWednesdayISO(): string {
  const today = new Date()
  const day = today.getDay()
  const daysUntilNextWed = ((3 - day + 7) % 7) + 7
  const result = new Date(today)
  result.setDate(today.getDate() + daysUntilNextWed)
  const y = result.getFullYear()
  const m = String(result.getMonth() + 1).padStart(2, '0')
  const d = String(result.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function cartItemsToPOLineItems(items: CartItem[]): POLineItem[] {
  return items.map(item => {
    const vendor = vendors.find(v => v.id === item.vendorId)
    const product = vendor?.products.find((p: any) => p.id === item.productId)
    return {
      vendorId: item.vendorId,
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: (product as any)?.wholesaleUnitPrice ?? 0,
    }
  })
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedPOId, setSelectedPOId] = useState('')
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [selectedDeliveryWeek, setSelectedDeliveryWeek] = useState(getNextWednesdayISO)
  const [repeatMode, setRepeatMode] = useState<'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom'>('none')
  const [customEndType, setCustomEndType] = useState<'never' | 'date' | 'after'>('never')
  const [localPurchaseOrders, setLocalPurchaseOrders] = useState([
    { id: '004-CHARLES-00017', label: '004-CHARLES-00017' },
    { id: '005-BRENDA-00098',  label: '005-BRENDA-00098'  },
    { id: '006-STEPH-00001',   label: '006-STEPH-00001'   },
    { id: '007-MARKET-00001',  label: '007-MARKET-00001'  },
  ])

  const hasActivePO = selectedPOId !== ''
  const activePO = purchaseOrders.find(po => po.id === selectedPOId)
  const isActivePODraft = !activePO || activePO.status === 'Draft'

  useEffect(() => { setMounted(true) }, [])

  // Auto-save: persist cart items to Draft PO on every change.
  // Skips when cart is empty or no PO is selected (staging mode).
  // Guard with `mounted` to ensure this never runs during SSR or before hydration.
  useEffect(() => {
    if (!mounted) return
    if (!selectedPOId || !hasActivePO || items.length === 0) return
    const po = purchaseOrders.find(p => p.id === selectedPOId)
    if (!po || po.status !== 'Draft') return
    const lineItems = cartItemsToPOLineItems(items)
    updateDraftPOLineItems(selectedPOId, lineItems)
  }, [items, selectedPOId, mounted])

  const addPurchaseOrder = (id: string) => {
    const trimmed = id.trim()
    if (!trimmed) return
    setLocalPurchaseOrders(prev => [...prev, { id: trimmed, label: trimmed }])
    setSelectedPOId(trimmed)
  }

  const clearItems = () => setItems([])

  const clearStagedItems = () => {
    setItems([])
    setSelectedPOId('')
  }

  const syncItemsFromPO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId)
    if (!po || po.status !== 'Draft') return
    setItems(po.lineItems.map(li => ({
      vendorId: li.vendorId,
      productId: li.productId,
      quantity: li.quantity,
      unit: li.unit,
    })))
    setSelectedPOId(poId)
    if (po.deliveryDate) setSelectedDeliveryWeek(po.deliveryDate)
  }

  const mergeStagedItemsIntoPO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId)
    if (!po || po.status !== 'Draft') return
    const stagedLineItems = cartItemsToPOLineItems(items)
    const merged = [...po.lineItems]
    for (const staged of stagedLineItems) {
      const idx = merged.findIndex(
        li => li.productId === staged.productId && li.vendorId === staged.vendorId
      )
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + staged.quantity }
      } else {
        merged.push(staged)
      }
    }
    updateDraftPOLineItems(poId, merged)
    syncItemsFromPO(poId)
  }

  const addNewDraftPO = (id: string, deliveryDate: string) => {
    addNewDraftPOData(id, deliveryDate)
    setLocalPurchaseOrders(prev => [...prev, { id, label: id }])
  }

  const generateNewPOId = () => generateNewPOIdData()

  const addItem = (vendorId: string, productId: string, quantity: number, unit: 'units' | 'cases') => {
    setItems(prev => {
      const existing = prev.find(i => i.vendorId === vendorId && i.productId === productId)
      if (existing) {
        const newQty = existing.quantity + quantity
        if (newQty <= 0) {
          return prev.filter(i => !(i.vendorId === vendorId && i.productId === productId))
        }
        return prev.map(i =>
          i.vendorId === vendorId && i.productId === productId
            ? { ...i, quantity: newQty, unit }
            : i
        )
      }
      if (quantity > 0) {
        return [...prev, { vendorId, productId, quantity, unit }]
      }
      return prev
    })
  }

  const removeItem = (vendorId: string, productId: string) => {
    setItems(prev => prev.filter(i => !(i.vendorId === vendorId && i.productId === productId)))
  }

  const getTotalUnits = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId)
    return items
      .filter(i => i.vendorId === vendorId)
      .reduce((sum, i) => {
        const unitsPerCase = vendor?.orderRules?.unitsPerCase ?? 1
        return sum + (i.unit === 'cases' ? i.quantity * unitsPerCase : i.quantity)
      }, 0)
  }

  const getTotalItems = () => items.reduce((sum, i) => sum + i.quantity, 0)

  const getMinUnitsRequired = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId)
    return vendor?.orderRules?.minUnits ?? 0
  }

  const isMinMet = (vendorId: string) => {
    return getTotalUnits(vendorId) >= getMinUnitsRequired(vendorId)
  }

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, clearItems, clearStagedItems,
      getTotalUnits, getTotalItems, getMinUnitsRequired, isMinMet,
      selectedPOId, setSelectedPOId, hasActivePO,
      purchaseOrders: localPurchaseOrders, addPurchaseOrder,
      isDrawerOpen, setDrawerOpen, isActivePODraft,
      selectedDeliveryWeek, setSelectedDeliveryWeek,
      repeatMode, setRepeatMode,
      customEndType, setCustomEndType,
      syncItemsFromPO, mergeStagedItemsIntoPO,
      addNewDraftPO, generateNewPOId,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
