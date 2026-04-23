'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cartContext'
import { vendors } from '@/lib/data'
import { purchaseOrders as poData } from '@/lib/purchaseOrdersData'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'

const COLORS = {
  primaryTeal:  '#28ba93',
  darkTeal:     '#035257',
  medTeal:      '#377b82',
  lightTeal:    '#beead8',
  beige:        '#f7f5ef',
  lightBeige:   '#fbf9f6',
  darkestGrey:  '#1f1f1f',
  darkGrey:     '#444955',
  midGrey:      '#777',
  lightGrey:    '#e6e6e6',
  border:       '#a1a4aa',
} as const

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatWeekOf(iso: string): string {
  const wed = parseISO(iso)
  const mon = new Date(wed)
  mon.setDate(wed.getDate() - 2)
  return mon.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatDeliveryShort(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDeliveryFull(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatWeekOption(iso: string): string {
  const wed = parseISO(iso)
  const mon = new Date(wed)
  mon.setDate(wed.getDate() - 2)
  const monLabel = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const wedLabel = wed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return `Week of ${monLabel} — ${wedLabel}`
}

const REPEAT_LABELS: Record<string, string> = {
  weekly:   'Weekly',
  biweekly: 'Bi-weekly',
  monthly:  'Monthly',
  custom:   'Custom',
}

function getEightWednesdays(fromISO: string): string[] {
  return Array.from({ length: 8 }, (_, i) => {
    const base = parseISO(fromISO)
    base.setDate(base.getDate() + i * 7)
    const y = base.getFullYear()
    const m = String(base.getMonth() + 1).padStart(2, '0')
    const d = String(base.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
}

// ── Mock recently purchased ───────────────────────────────────────────────────
const recentlyPurchased = [
  { vendorId: '2betties',                  productId: '16821', vendorName: '2Betties',           productName: 'Bites (2-pack) - Chocolate Chunk', price: 1.89 },
  { vendorId: 'ethiopian-delights',        productId: '10616', vendorName: 'Ethiopian Delights', productName: 'Spicy Red Lentil Stew',            price: 6.29 },
  { vendorId: 'open-seas-coffee-roasters', productId: '16523', vendorName: 'Open Seas Coffee',   productName: 'Cold Brew, Can',                   price: 3.25 },
  { vendorId: '2betties',                  productId: '16822', vendorName: '2Betties',           productName: 'Bites (2-pack) - Lemon',           price: 1.89 },
  { vendorId: 'ethiopian-delights',        productId: '10617', vendorName: 'Ethiopian Delights', productName: 'Mild Split Pea Stew',              price: 6.29 },
  { vendorId: '2betties',                  productId: '16823', vendorName: '2Betties',           productName: 'Bites (2-pack) - Maple Cinnamon',  price: 1.89 },
]

function CheckIcon({ color = 'white' }: { color?: string }) {
  return (
    <svg viewBox="0 0 11 9" fill="none" className="w-[11px] h-[9px]">
      <path d="M1 4.5L4 7.5L10 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 7 4" fill="none" className="w-[7px] h-[4px]">
      <path d="M1 1l2.5 2L6 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 7 11" fill="none" className="w-[7px] h-[11px]">
      <path d="M1 1l4.5 4.5L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M7.5 2l2.5 2.5L4 10.5H1.5V8L7.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function CartDrawer() {
  const router = useRouter()
  const {
    items, isDrawerOpen, setDrawerOpen,
    selectedPOId, setSelectedPOId, hasActivePO, purchaseOrders, addPurchaseOrder,
    getTotalUnits, getMinUnitsRequired,
    clearItems, clearStagedItems,
    selectedDeliveryWeek, setSelectedDeliveryWeek,
    repeatMode, setRepeatMode,
    customEndType, setCustomEndType,
    mergeStagedItemsIntoPO, addNewDraftPO, generateNewPOId,
  } = useCart()

  const [poDropdownOpen, setPODropdownOpen]   = useState(false)
  const [addingNewPO, setAddingNewPO]         = useState(false)
  const [newPOName, setNewPOName]             = useState('')
  const [newPOError, setNewPOError]           = useState('')
  const newPOInputRef                         = useRef<HTMLInputElement>(null)
  const [drawerView, setDrawerView]           = useState<'cart' | 'confirmation' | 'success'>('cart')
  const [successCountdown, setSuccessCountdown] = useState(8)
  const [shouldClose, setShouldClose]         = useState(false)
  const [showDeliveryEditor, setShowDeliveryEditor] = useState(false)
  const navigateToDraftOnCloseRef             = useRef(false)
  const [showSaved, setShowSaved]             = useState(false)
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false)
  const [saveState, setSaveState]             = useState<'idle' | 'saving' | 'saved'>('idle')

  // ── Close helper ──────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (!hasActivePO && items.length > 0) {
      setShowDiscardPrompt(true)
      return
    }
    doClose()
  }

  const doClose = () => {
    setDrawerOpen(false)
    setDrawerView('cart')
    setShowDiscardPrompt(false)
    if (navigateToDraftOnCloseRef.current) {
      navigateToDraftOnCloseRef.current = false
      clearItems()
      router.push('/purchase-orders?tab=draft')
    }
  }

  // ── Auto-focus new PO input ───────────────────────────────────────────────────
  useEffect(() => {
    if (addingNewPO) {
      setTimeout(() => newPOInputRef.current?.focus(), 50)
    }
  }, [addingNewPO])

  // ── Deferred close — avoids setState-during-render warning ───────────────────
  useEffect(() => {
    if (!shouldClose) return
    setShouldClose(false)
    handleClose()
  }, [shouldClose])

  // ── Success auto-close countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (drawerView !== 'success') return
    navigateToDraftOnCloseRef.current = true
    setSuccessCountdown(8)
    const interval = setInterval(() => {
      setSuccessCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setShouldClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [drawerView])

  // ── Auto-save indicator — only shown when items are actually saved to a PO ────
  useEffect(() => {
    if (items.length === 0 || !hasActivePO) return
    setShowSaved(true)
    const t = setTimeout(() => setShowSaved(false), 2000)
    return () => clearTimeout(t)
  }, [items])

  // ── PO handlers ───────────────────────────────────────────────────────────────
  const handleSaveNewPO = () => {
    const trimmed = newPOName.trim().toUpperCase()
    if (!trimmed) { setNewPOError('Please enter a PO name'); return }
    if (trimmed.length > 30) { setNewPOError('Maximum 30 characters'); return }
    if (purchaseOrders.find(po => po.id === trimmed)) { setNewPOError('This PO already exists'); return }
    addPurchaseOrder(trimmed)
    setNewPOName(''); setNewPOError(''); setAddingNewPO(false)
  }

  const handleCancelNewPO = () => {
    setNewPOName(''); setNewPOError(''); setAddingNewPO(false)
  }

  const handleSavePO = async () => {
    if (saveState === 'saving' || items.length === 0) return
    setSaveState('saving')
    await new Promise(resolve => setTimeout(resolve, 600))
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 1500)
  }

  // ── Data derivation ───────────────────────────────────────────────────────────
  const itemsByVendor = vendors
    .map(vendor => {
      const vendorItems = items.filter(i => i.vendorId === vendor.id)
      if (vendorItems.length === 0) return null
      const vendorProducts = vendorItems
        .map(item => {
          const product = vendor.products.find(p => p.id === item.productId)
          return product ? { ...item, product, vendor } : null
        })
        .filter(Boolean) as Array<{
          vendorId: string; productId: string; quantity: number; unit: string;
          product: (typeof vendor.products)[0]; vendor: typeof vendor
        }>
      const vendorTotal = vendorProducts.reduce((sum, i) => sum + i.product.wholesaleUnitPrice * i.quantity, 0)
      const totalUnits  = getTotalUnits(vendor.id)
      const minRequired = getMinUnitsRequired(vendor.id)
      const minMet      = totalUnits >= minRequired
      return { vendor, vendorProducts, vendorTotal, minMet }
    })
    .filter(Boolean) as Array<{
      vendor: typeof vendors[0]; vendorProducts: any[];
      vendorTotal: number; minMet: boolean
    }>

  const purchaseOrderTotal = itemsByVendor.reduce((sum, g) => sum + g.vendorTotal, 0)
  const allMinsMet = itemsByVendor.length > 0 && itemsByVendor.every(g => g.minMet)
  const overallProgress = itemsByVendor.length > 0
    ? itemsByVendor.reduce((sum, { vendor }) => {
        const min = getMinUnitsRequired(vendor.id)
        return sum + (min > 0 ? Math.min((getTotalUnits(vendor.id) / min) * 100, 100) : 100)
      }, 0) / itemsByVendor.length
    : 0

  // ── Delivery date helpers ─────────────────────────────────────────────────────
  const getDeliveryForPO = (poId: string): string | null => {
    const staticPO = poData.find(p => p.id === poId)
    return staticPO?.deliveryDate ?? selectedDeliveryWeek
  }

  const selectedPODelivery = getDeliveryForPO(selectedPOId)

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop — desktop only */}
          <motion.div
            className="hidden md:block fixed inset-0 bg-black/30 z-[70]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Drawer panel — full-screen on mobile, side panel on desktop */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full md:w-[520px] z-[80] overflow-hidden"
            style={{ backgroundColor: COLORS.beige, fontFamily: 'var(--font-lato), Arial, sans-serif' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <AnimatePresence mode="wait">

              {/* ══════════════════ CART VIEW ══════════════════ */}
              {drawerView === 'cart' && (
                <motion.div
                  key="cart"
                  className="flex flex-col h-full relative"
                  initial={{ opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Scrollable body */}
                  <div className="flex-1 flex flex-col overflow-y-auto min-h-0">

                    {/* Header */}
                    <div
                      className="sticky top-0 z-10 flex items-center justify-between px-4 shrink-0 border-b-2 relative"
                      style={{ height: '50px', borderColor: COLORS.lightGrey, backgroundColor: COLORS.beige }}
                    >
                      {/* Title — left */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: COLORS.darkestGrey, fontSize: '14px' }}>Draft Purchase Order</span>
                        <AnimatePresence>
                          {showSaved && (
                            <motion.div
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="hidden md:flex items-center gap-1 text-[11px] text-[#28ba93]"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#28ba93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Draft saved
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Close — right */}
                      <button onClick={handleClose} aria-label="Close cart"
                        className="no-min-h flex items-center justify-center w-6 h-6 hover:opacity-70 transition-opacity"
                        style={{ color: COLORS.darkestGrey }}
                      >
                        <CloseIcon />
                      </button>
                    </div>

                    {/* PO selector — or "Assign to PO" prompt in staging mode */}
                    {!hasActivePO && items.length > 0 ? (
                      /* ── Staging mode: assign items to a PO ── */
                      <div className="border-b-2 shrink-0 px-4 py-3" style={{ borderColor: COLORS.lightGrey, backgroundColor: '#fafafa' }}>
                        <p className="text-[13px] font-bold text-[#1f1f1f] mb-1">Assign to a Purchase Order</p>
                        <p className="text-[11px] mb-3" style={{ color: COLORS.midGrey }}>
                          Select an existing Draft PO or create a new one to save these items.
                        </p>
                        {poData.filter(po => po.status === 'Draft').map(po => (
                          <button
                            key={po.id}
                            onClick={() => mergeStagedItemsIntoPO(po.id)}
                            className="w-full flex items-center justify-between px-3 py-2.5 mb-1.5 bg-white border border-[#e8e8e8] rounded-xl hover:border-[#28ba93] hover:bg-[#f0fdf8] transition-colors text-left"
                          >
                            <div>
                              <p className="text-[13px] font-bold text-[#28ba93]">{po.id}</p>
                              <p className="text-[11px] text-[#777]">
                                Delivery: {po.deliveryDateShort ?? 'No date set'}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-[#28ba93]">Merge items →</span>
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const newId = generateNewPOId()
                            const delivery = selectedDeliveryWeek
                            addNewDraftPO(newId, delivery)
                            mergeStagedItemsIntoPO(newId)
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#28ba93] text-white rounded-xl hover:bg-[#22a882] transition-colors font-bold text-[13px] mt-2"
                        >
                          + Create New Draft PO
                        </button>
                      </div>
                    ) : (
                      /* ── Normal mode: PO selector ── */
                      <div className="border-b-2 shrink-0" style={{ borderColor: COLORS.lightGrey }}>
                      <button
                        className="flex items-center gap-2 w-full px-4 text-left"
                        style={{ height: '50px' }}
                        onClick={() => setPODropdownOpen(v => !v)}
                      >
                        <span className="font-bold" style={{ color: COLORS.darkestGrey, fontSize: '14px' }}>Added to Draft PO</span>
                        <span className="font-bold" style={{ color: COLORS.medTeal, fontSize: '14px' }}>{selectedPOId}</span>
                        {selectedPODelivery && (
                          <span className="ml-auto mr-1 text-[11px]" style={{ color: COLORS.midGrey }}>
                            {formatDeliveryShort(selectedPODelivery)}
                          </span>
                        )}
                        <motion.div animate={{ rotate: poDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDownIcon />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {poDropdownOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="overflow-hidden px-4 pb-4"
                          >
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-bold text-[#1f1f1f]">Recent Open Purchase Orders</span>
                              {!addingNewPO && (
                                <motion.button
                                  onClick={() => setAddingNewPO(true)}
                                  className="flex items-center gap-1.5 bg-[#beead8] hover:bg-[#a8dcc4] transition-colors rounded-full h-[26px] px-3 text-[11px] font-bold text-[#035257]"
                                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                >
                                  Add New
                                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                    <path d="M5.5 1v9M1 5.5h9" stroke="#035257" strokeWidth="1.5" strokeLinecap="round"/>
                                  </svg>
                                </motion.button>
                              )}
                            </div>

                            {/* New PO input */}
                            <AnimatePresence>
                              {addingNewPO && (
                                <motion.div
                                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                                  className="mb-3"
                                >
                                  <div className="flex items-center gap-2 py-1">
                                    <div className="w-4 h-4 rounded-[2px] border-2 border-dashed border-[#28ba93] shrink-0" />
                                    <div className="flex-1 relative">
                                      <input
                                        ref={newPOInputRef}
                                        type="text" value={newPOName} maxLength={30}
                                        placeholder="e.g. 007-MARKET-00001"
                                        onChange={e => { setNewPOName(e.target.value.slice(0, 30)); setNewPOError('') }}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveNewPO(); if (e.key === 'Escape') handleCancelNewPO() }}
                                        className={`w-full h-[26px] text-[11px] font-bold text-[#377b82] bg-transparent border-b-2 outline-none transition-colors placeholder-[#a1a4aa] ${newPOError ? 'border-red-400' : 'border-[#28ba93]'}`}
                                      />
                                      <span className="absolute right-0 top-[6px] text-[10px] text-[#a1a4aa]">{newPOName.length}/30</span>
                                    </div>
                                  </div>
                                  <AnimatePresence>
                                    {newPOError && (
                                      <motion.p
                                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="text-[10px] text-red-400 mt-1 ml-6"
                                      >{newPOError}</motion.p>
                                    )}
                                  </AnimatePresence>
                                  <div className="flex items-center gap-2 mt-2 ml-6">
                                    <motion.button
                                      onClick={handleSaveNewPO} disabled={!newPOName.trim()}
                                      className={`h-[24px] px-3 rounded-full text-[11px] font-bold transition-all ${newPOName.trim() ? 'bg-[#28ba93] text-white hover:bg-[#22a882]' : 'bg-[#e6e6e6] text-[#a1a4aa] cursor-not-allowed'}`}
                                      whileHover={newPOName.trim() ? { scale: 1.02 } : {}}
                                      whileTap={newPOName.trim() ? { scale: 0.97 } : {}}
                                    >Save</motion.button>
                                    <button onClick={handleCancelNewPO}
                                      className="h-[24px] px-3 rounded-full text-[11px] font-bold text-[#777] hover:text-[#444955] transition-colors"
                                    >Cancel</button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* PO list */}
                            <div className="flex flex-col gap-0.5">
                              {purchaseOrders.map(po => {
                                const isSelected = po.id === selectedPOId
                                const delivery = getDeliveryForPO(po.id)
                                return (
                                  <motion.button
                                    key={po.id}
                                    onClick={() => { setSelectedPOId(po.id); setPODropdownOpen(false) }}
                                    className="flex items-center gap-3 w-full text-left px-2 py-2 rounded-lg hover:bg-[#f7f5ef] transition-colors"
                                    whileHover={{ x: 2 }} transition={{ duration: 0.1 }}
                                  >
                                    <div className={`w-4 h-4 rounded-[2px] flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-[#28ba93] border-[#28ba93]' : 'bg-white border-[#a1a4aa]'}`}>
                                      {isSelected && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`flex-1 text-[13px] font-bold transition-colors ${isSelected ? 'text-[#28ba93]' : 'text-[#377b82] opacity-60'}`}>
                                      {po.label}
                                    </span>
                                    {delivery && (
                                      <span className="text-[12px] text-[#777] shrink-0">
                                        Delivery: {formatDeliveryShort(delivery)}
                                      </span>
                                    )}
                                    {!['004-CHARLES-00017', '005-BRENDA-00098', '006-STEPH-00001'].includes(po.id) && (
                                      <span className="text-[10px] bg-[#beead8] text-[#035257] font-bold px-2 py-0.5 rounded-full shrink-0">New</span>
                                    )}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    )}

                    {/* Ordering window / delivery editor */}
                    <div className="border-b-2 shrink-0" style={{ borderColor: COLORS.lightGrey }}>
                      <AnimatePresence mode="wait">
                        {showDeliveryEditor ? (
                          <motion.div
                            key="editor"
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                            className="px-4 py-3"
                          >
                            {/* Delivery week selector */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[12px] text-[#777] w-[100px] shrink-0">Delivery week</span>
                              <select
                                value={selectedDeliveryWeek}
                                onChange={e => setSelectedDeliveryWeek(e.target.value)}
                                className="flex-1 text-[12px] border border-[#e8e8e8] rounded-lg px-3 h-[30px] bg-white text-[#444955] outline-none cursor-pointer hover:border-[#28ba93] focus:border-[#28ba93] transition-colors"
                              >
                                {getEightWednesdays(selectedDeliveryWeek).map(iso => (
                                  <option key={iso} value={iso}>{formatWeekOption(iso)}</option>
                                ))}
                              </select>
                            </div>

                            {/* Repeat selector */}
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-[12px] text-[#777] w-[100px] shrink-0">Repeat</span>
                              <select
                                value={repeatMode}
                                onChange={e => setRepeatMode(e.target.value as typeof repeatMode)}
                                className="flex-1 text-[12px] border border-[#e8e8e8] rounded-lg px-3 h-[30px] bg-white text-[#444955] outline-none cursor-pointer hover:border-[#28ba93] focus:border-[#28ba93] transition-colors"
                              >
                                <option value="none">Does not repeat</option>
                                <option value="weekly">Weekly every Wednesday</option>
                                <option value="biweekly">Bi-weekly (every 2 weeks)</option>
                                <option value="monthly">Monthly (first Wednesday)</option>
                                <option value="custom">Custom...</option>
                              </select>
                            </div>

                            {/* Custom repeat expansion */}
                            {repeatMode === 'custom' && (
                              <div className="bg-white border border-[#e8e8e8] rounded-xl p-3 mb-3 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[12px] text-[#444955]">
                                  <span>Every</span>
                                  <select className="w-[52px] border border-[#e8e8e8] rounded-lg h-[28px] px-2 text-[12px] text-center outline-none">
                                    {[1, 2, 3, 4, 6, 8].map(n => <option key={n}>{n}</option>)}
                                  </select>
                                  <select className="border border-[#e8e8e8] rounded-lg h-[28px] px-2 text-[12px] outline-none">
                                    <option>Week(s)</option>
                                    <option>Month(s)</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] text-[#444955]">
                                  <span className="w-[36px]">Ends</span>
                                  <select
                                    value={customEndType}
                                    onChange={e => setCustomEndType(e.target.value as typeof customEndType)}
                                    className="border border-[#e8e8e8] rounded-lg h-[28px] px-2 text-[12px] outline-none"
                                  >
                                    <option value="never">Never</option>
                                    <option value="date">On date</option>
                                    <option value="after">After N deliveries</option>
                                  </select>
                                  {customEndType === 'date' && (
                                    <input type="date" className="border border-[#e8e8e8] rounded-lg h-[28px] px-2 text-[12px] outline-none" />
                                  )}
                                  {customEndType === 'after' && (
                                    <div className="flex items-center gap-1">
                                      <input type="number" min="1" defaultValue="4"
                                        className="w-[48px] border border-[#e8e8e8] rounded-lg h-[28px] px-2 text-[12px] text-center outline-none" />
                                      <span>deliveries</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Done button */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => setShowDeliveryEditor(false)}
                                className="text-[12px] font-bold text-white bg-[#28ba93] rounded-full px-4 h-[28px] hover:bg-[#22a882] transition-colors"
                              >
                                Done
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="banner"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                            className="flex items-center gap-2 px-4 py-2.5"
                          >
                            <span className="text-[12px]" style={{ color: COLORS.midGrey }}>Ordering for:</span>
                            <span className="text-[12px] font-bold" style={{ color: COLORS.darkestGrey }}>
                              Week of {formatWeekOf(selectedDeliveryWeek)}
                            </span>
                            {repeatMode !== 'none' && (
                              <span className="text-[11px] font-bold" style={{ color: COLORS.primaryTeal }}>
                                · {REPEAT_LABELS[repeatMode]}
                              </span>
                            )}
                            <button
                              onClick={() => setShowDeliveryEditor(true)}
                              className="ml-1 flex items-center justify-center hover:opacity-70 transition-opacity"
                              style={{ color: COLORS.primaryTeal }}
                            >
                              <PencilIcon />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Cart items — no px on outer wrapper so dividers can be full-bleed */}
                    <div className="flex flex-col flex-1">

                      {/* Empty state */}
                      {itemsByVendor.length === 0 && (
                        <div className="px-4 flex flex-col items-center justify-center py-16 text-center">
                          <p className="font-bold" style={{ color: COLORS.darkGrey, fontSize: '16px' }}>Your PO is empty</p>
                          <p className="mt-1" style={{ color: COLORS.midGrey, fontSize: '13px' }}>Add products to get started</p>
                        </div>
                      )}

                      {/* Vendor groups */}
                      {itemsByVendor.length > 0 && (
                        <div className="px-4 pt-4 pb-4 flex flex-col gap-4">
                          {itemsByVendor.map(({ vendor, vendorProducts, vendorTotal, minMet }) => {
                            const totalUnits  = getTotalUnits(vendor.id)
                            const minRequired = getMinUnitsRequired(vendor.id)
                            const remaining   = Math.max(0, minRequired - totalUnits)
                            const progress    = minRequired > 0 ? Math.min((totalUnits / minRequired) * 100, 100) : 100

                            return (
                              <div key={vendor.id} className="bg-white flex flex-col"
                                style={{ borderRadius: '20px', boxShadow: '2px 2px 10px 0px rgba(156,153,153,0.25)' }}
                              >
                                {/* Vendor header */}
                                <div className="flex items-center justify-between px-4 py-3">
                                  <span className="font-bold" style={{ color: COLORS.midGrey, fontSize: '14px' }}>{vendor.name}</span>
                                  <Link href={`/vendors/${vendor.id}`} onClick={handleClose}
                                    className="text-[12px] font-bold text-[#28ba93] hover:underline whitespace-nowrap no-min-h"
                                  >Add more</Link>
                                </div>

                                {/* Min order progress */}
                                <div className="flex items-center gap-3 px-4 pb-4">
                                  {minMet ? (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <CheckIcon color={COLORS.darkTeal} />
                                      <span className="font-bold" style={{ color: COLORS.darkTeal, fontSize: '11px' }}>Minimum order quantity has been met</span>
                                    </div>
                                  ) : (
                                    <span className="font-bold shrink-0" style={{ color: COLORS.darkTeal, fontSize: '11px' }}>
                                      Add {remaining} more item{remaining !== 1 ? 's' : ''} to meet min
                                    </span>
                                  )}
                                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: '3px', backgroundColor: COLORS.lightGrey }}>
                                    <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS.darkTeal }}
                                      animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                  </div>
                                </div>

                                {/* Product rows */}
                                <div className="flex flex-col">
                                  {vendorProducts.map((item: any) => (
                                    <div key={item.productId}
                                      className="flex items-center justify-between px-4 py-3"
                                      style={{ backgroundColor: COLORS.lightBeige, marginBottom: '1px' }}
                                    >
                                      <div className="flex items-center gap-2" style={{ width: '65%' }}>
                                        <div className="w-[65px] h-[60px] shrink-0 flex items-center justify-center">
                                          {item.product.image && (
                                            <img src={item.product.image} alt={item.product.name}
                                              className="w-full h-full object-contain mix-blend-multiply"
                                            />
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                          <span className="font-bold" style={{ color: COLORS.darkTeal, fontSize: '11px' }}>{vendor.name}</span>
                                          <span className="font-bold leading-tight" style={{ color: COLORS.darkGrey, fontSize: '11px' }}>{item.product.name}</span>
                                          <span style={{ color: COLORS.darkestGrey, fontSize: '11px' }}>
                                            ${(item.product.wholesaleUnitPrice * item.quantity).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                      <AddToCartButton vendorId={vendor.id} productId={item.productId} />
                                    </div>
                                  ))}
                                </div>

                                {/* Vendor subtotal */}
                                <div className="flex items-center justify-between px-4 py-3">
                                  <span className="font-bold" style={{ color: COLORS.midGrey, fontSize: '14px' }}>Vendor Subtotal</span>
                                  <span className="font-bold" style={{ color: COLORS.midGrey, fontSize: '14px' }}>${vendorTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* PO subtotal — standalone full-bleed divider, sibling of padded content */}
                      {itemsByVendor.length > 0 && (
                        <>
                          <div className="w-full h-[2px] bg-[#e6e6e6] shrink-0" />
                          <div className="flex items-center justify-between px-4 py-3 shrink-0">
                            <span className="font-bold" style={{ color: COLORS.darkestGrey, fontSize: '14px' }}>Purchase Order Subtotal</span>
                            <span className="font-bold" style={{ color: COLORS.darkestGrey, fontSize: '14px' }}>${purchaseOrderTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      {/* Recently Purchased — standalone full-bleed divider */}
                      <div className="w-full h-[2px] bg-[#e6e6e6] shrink-0" />
                      <div className="px-4 pt-4 pb-4">
                        <div className="flex items-center justify-between py-3">
                          <span className="font-bold" style={{ color: COLORS.darkestGrey, fontSize: '11px' }}>Recently Purchased</span>
                          <button className="flex items-center gap-1 font-bold" style={{ color: COLORS.darkTeal, fontSize: '11px' }}>
                            View all <ChevronRightIcon />
                          </button>
                        </div>
                        <div className="flex items-stretch gap-2 overflow-x-auto pb-4 scrollbar-hide">
                          {recentlyPurchased.map((rp, i) => {
                            const rpVendor  = vendors.find(v => v.id === rp.vendorId)
                            const rpProduct = rpVendor?.products.find(p => p.id === rp.productId)
                            if (!rpVendor || !rpProduct) return null
                            return (
                              <div key={i} className="shrink-0 w-[150px] flex flex-col [&>a]:flex-1 [&>a]:flex [&>a]:flex-col [&>a>div]:!w-full [&>a>div]:flex-1">
                                <ProductCard product={rpProduct} vendor={rpVendor} />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discard prompt overlay */}
                  <AnimatePresence>
                    {showDiscardPrompt && (
                      <motion.div
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8"
                        style={{ backgroundColor: 'rgba(247,245,239,0.97)' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] flex flex-col items-center gap-4 text-center"
                          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#fff3cd] flex items-center justify-center shrink-0">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 6v5M10 14h.01" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round"/>
                              <circle cx="10" cy="10" r="8.5" stroke="#b45309" strokeWidth="1.5"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-[#1f1f1f] mb-1">Discard staged items?</p>
                            <p className="text-[13px] text-[#777] leading-snug">
                              You have {items.length} item{items.length !== 1 ? 's' : ''} that haven't been assigned to a Purchase Order. They'll be lost if you close.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <button
                              onClick={() => setShowDiscardPrompt(false)}
                              className="w-full h-[42px] rounded-full font-bold text-[14px] bg-[#28ba93] text-white hover:bg-[#22a882] transition-colors"
                            >
                              Keep shopping
                            </button>
                            <button
                              onClick={() => { clearStagedItems(); doClose() }}
                              className="w-full h-[42px] rounded-full font-bold text-[14px] border border-[#e6e6e6] text-[#777] hover:bg-[#f7f5ef] transition-colors"
                            >
                              Discard items
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sticky bottom CTA */}
                  <div className="shrink-0">
                    <div className="flex items-center justify-between px-4" style={{ backgroundColor: COLORS.lightTeal, height: '50px' }}>
                      <div className="flex items-center gap-3">
                        {allMinsMet ? (
                          <>
                            <CheckIcon color={COLORS.darkTeal} />
                            <span style={{ color: COLORS.darkestGrey, fontSize: '14px' }}>Order minimums met</span>
                          </>
                        ) : (
                          <span style={{ color: COLORS.darkestGrey, fontSize: '14px' }}>Add more items to meet min order quantity</span>
                        )}
                      </div>
                      <button onClick={handleClose} aria-label="Close cart"
                        className="flex items-center justify-center w-6 h-6 hover:opacity-70 transition-opacity"
                        style={{ color: COLORS.darkestGrey }}
                      ><CloseIcon /></button>
                    </div>

                    <div className="h-[4px] w-full" style={{ backgroundColor: COLORS.lightGrey }}>
                      <motion.div className="h-full" style={{ backgroundColor: COLORS.darkTeal }}
                        animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>

                    <div className="flex items-center gap-2 px-4" style={{ height: '65px', backgroundColor: COLORS.beige }}>
                      {/* Save Draft — 1/3 */}
                      <button
                          onClick={handleSavePO}
                          disabled={saveState === 'saving' || items.length === 0}
                          aria-label={saveState === 'idle' ? 'Save draft purchase order' : saveState === 'saving' ? 'Saving draft...' : 'Draft saved'}
                          aria-disabled={saveState === 'saving' || items.length === 0}
                          className="no-min-h basis-1/3 rounded-full font-bold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96]"
                          style={{
                            height: '52px',
                            fontSize: '14px',
                            backgroundColor: saveState !== 'idle' ? COLORS.primaryTeal : 'white',
                            color: saveState !== 'idle' ? 'white' : COLORS.primaryTeal,
                          }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={saveState}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1.5"
                            >
                              {saveState === 'idle' && 'Save Draft'}
                              {saveState === 'saving' && (
                                <>
                                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60"/>
                                  </svg>
                                  Saving...
                                </>
                              )}
                              {saveState === 'saved' && (
                                <>
                                  <motion.svg
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                                  >
                                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                  </motion.svg>
                                  Saved
                                </>
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </button>
                      {/* Continue to PO — 2/3 */}
                      <button
                        className="no-min-h basis-2/3 flex-1 rounded-full font-bold transition-all no-min-h disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        style={{
                          height: '52px',
                          backgroundColor: allMinsMet ? COLORS.primaryTeal : COLORS.lightGrey,
                          color: allMinsMet ? 'white' : COLORS.border,
                          fontSize: '18px',
                        }}
                        onClick={() => setDrawerView('confirmation')}
                        disabled={!allMinsMet}
                      >
                        Continue to PO
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════ CONFIRMATION VIEW ══════════════════ */}
              {drawerView === 'confirmation' && (
                <motion.div
                  key="confirmation"
                  className="flex flex-col h-full relative"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {/* Confirmation header */}
                  <div
                    className="flex items-center justify-between h-[50px] px-4 border-b-2 border-[#e6e6e6] shrink-0"
                    style={{ backgroundColor: COLORS.beige }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDrawerView('cart')}
                        className="text-[11px] font-bold text-[#377b82] hover:text-[#035257] transition-colors flex items-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit Order
                      </button>
                      <div className="w-px h-4 bg-[#e6e6e6]" />
                      <span className="text-[14px] font-bold text-[#1f1f1f]">Order Confirmation</span>
                    </div>
                    <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center text-[#777] hover:text-[#1f1f1f] transition-colors">
                      <CloseIcon />
                    </button>
                  </div>

                  {/* PO badge — read only */}
                  <div
                    className="flex items-center gap-2 h-[50px] px-4 border-b-2 border-[#e6e6e6] shrink-0"
                    style={{ backgroundColor: COLORS.beige }}
                  >
                    <span className="text-[14px] font-bold text-[#1f1f1f]">Purchase Order</span>
                    <div className="flex items-center gap-1.5 bg-[#beead8] rounded-full px-3 h-[26px]">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 5.5l2.5 2.5 5.5-6" stroke="#035257" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[11px] font-bold text-[#035257]">{selectedPOId}</span>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">

                    {/* Read-only vendor cards */}
                    {itemsByVendor.map(group => {
                      if (!group) return null
                      const { vendor, vendorProducts, vendorTotal } = group
                      return (
                        <div key={vendor.id}
                          className="mx-4 bg-white rounded-[20px] overflow-hidden border border-[#e8e8e8]"
                          style={{ boxShadow: '2px 2px 10px 0px rgba(156,153,153,0.25)' }}
                        >
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[#28ba93] flex items-center justify-center shrink-0">
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                              <span className="text-[14px] font-bold text-[#777]">{vendor.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#28ba93] uppercase tracking-wide">Order sent</span>
                          </div>

                          <div className="flex flex-col">
                            {vendorProducts.map((item: any) => {
                              if (!item) return null
                              const lineTotal = (item.product.wholesaleUnitPrice * item.quantity).toFixed(2)
                              return (
                                <div key={item.productId} className="flex items-center justify-between p-4 bg-[#fbf9f6] mb-[1px]">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-[65px] h-[60px] shrink-0 flex items-center justify-center bg-[#f7f5ef] rounded-md overflow-hidden">
                                      <img src={item.product.image} alt={item.product.name}
                                        className="w-full h-full object-contain mix-blend-multiply p-1"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                      <span className="text-[11px] font-bold text-[#035257] truncate">{vendor.name}</span>
                                      <span className="text-[11px] font-bold text-[#444955] leading-tight truncate">{item.product.name}</span>
                                      <span className="text-[11px] text-[#363636]">${lineTotal}</span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 ml-3 bg-[#f0f0f0] rounded-full h-[26px] px-4 flex items-center justify-center">
                                    <span className="text-[11px] font-bold text-[#444955]">× {item.quantity}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-[14px] font-bold text-[#777]">Vendor Subtotal</span>
                            <span className="text-[14px] font-bold text-[#777]">${vendorTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}

                    {/* PO Total */}
                    <div className="w-full h-[2px] bg-[#e6e6e6] shrink-0" />
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[14px] font-bold text-[#1f1f1f]">Purchase Order Total</span>
                      <span className="text-[14px] font-bold text-[#1f1f1f]">${purchaseOrderTotal.toFixed(2)}</span>
                    </div>

                    {/* Order summary pill */}
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="flex items-center gap-2 bg-[#f7f5ef] border border-[#e6e6e6] rounded-full px-4 py-2">
                        <span className="text-[11px] text-[#777]">
                          {items.reduce((sum, i) => sum + i.quantity, 0)} items across {itemsByVendor.length} vendor{itemsByVendor.length !== 1 ? 's' : ''}
                        </span>
                        <div className="w-px h-3 bg-[#e6e6e6]" />
                        <span className="text-[11px] font-bold text-[#1f1f1f]">${purchaseOrderTotal.toFixed(2)} total</span>
                      </div>
                    </div>

                    {/* Bottom padding for fixed CTA */}
                    <div className="h-[100px]" />
                  </div>

                  {/* Sticky bottom CTAs */}
                  <div
                    className="absolute bottom-0 left-0 right-0 border-t-2 border-[#e6e6e6] px-4 py-4 flex flex-col gap-3"
                    style={{ backgroundColor: COLORS.beige }}
                  >
                    <motion.button
                      onClick={() => setDrawerView('success')}
                      className="w-full h-[49px] rounded-full bg-[#28ba93] text-white text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#22a882] transition-colors"
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    >
                      Submit PO for Review
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════ SUCCESS VIEW ══════════════════ */}
              {drawerView === 'success' && (
                <motion.div
                  key="success"
                  className="flex flex-col h-full items-center justify-center px-8 text-center relative"
                  style={{ backgroundColor: COLORS.beige }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Close button */}
                  <button onClick={handleClose}
                    className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[#777] hover:text-[#1f1f1f] transition-colors"
                  ><CloseIcon /></button>

                  {/* Success graphic */}
                  <motion.div
                    className="relative mb-8"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#28ba93]/20"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="w-24 h-24 rounded-full bg-[#28ba93] flex items-center justify-center relative z-10">
                      <motion.svg width="40" height="32" viewBox="0 0 40 32" fill="none">
                        <motion.path
                          d="M3 16l11 11L37 3"
                          stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      </motion.svg>
                    </div>
                  </motion.div>

                  {/* Success text */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="flex flex-col items-center gap-3 mb-8"
                  >
                    <h2 className="text-[24px] font-black text-[#1f1f1f]">PO Submitted!</h2>
                    <p className="text-[14px] text-[#777] leading-relaxed max-w-[280px]">
                      Your purchase order <span className="font-bold text-[#035257]">{selectedPOId}</span> has been submitted for review. Vendors will be notified shortly.
                    </p>

                    {/* Vendor confirmation list */}
                    <div className="flex flex-col gap-2 w-full mt-2">
                      {itemsByVendor.map((group, idx) => group && (
                        <motion.div
                          key={group.vendor.id}
                          className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#e6e6e6]"
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#28ba93] flex items-center justify-center shrink-0">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <span className="text-[13px] font-bold text-[#444955] flex-1 text-left">{group.vendor.name}</span>
                          <span className="text-[11px] text-[#28ba93] font-bold">Notified</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Auto-close countdown */}
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="flex flex-col items-center gap-3 w-full"
                  >
                    <div className="w-full h-1 bg-[#e6e6e6] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#28ba93] rounded-full"
                        initial={{ width: '100%' }} animate={{ width: '0%' }}
                        transition={{ duration: 8, ease: 'linear' }}
                      />
                    </div>
                    <p className="text-[11px] text-[#a1a4aa]">Closing in {successCountdown}s</p>
                    <button onClick={handleClose}
                      className="text-[13px] font-bold text-[#035257] hover:underline transition-colors"
                    >
                      Close and continue shopping
                    </button>
                  </motion.div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
