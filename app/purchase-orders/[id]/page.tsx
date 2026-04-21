'use client'
import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { purchaseOrders } from '@/lib/purchaseOrdersData'

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDeliveryFull(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// Returns 8 Wednesdays starting from the given ISO date, as {iso, label} pairs
function getEightWednesdays(fromISO: string): { iso: string; label: string }[] {
  return Array.from({ length: 8 }, (_, i) => {
    const d = parseISO(fromISO)
    d.setDate(d.getDate() + i * 7)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return {
      iso: `${y}-${m}-${day}`,
      label: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    }
  })
}
import { vendors } from '@/lib/data'
import POStatusBadge from '@/components/POStatusBadge'
import PODropdownMenu from '@/components/PODropdownMenu'
import Sidebar from '@/components/Sidebar'
import { useCart } from '@/lib/cartContext'

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    setSelectedPOId, setDrawerOpen, isActivePODraft, syncItemsFromPO, isDrawerOpen,
    selectedDeliveryWeek, setSelectedDeliveryWeek,
    repeatMode, setRepeatMode,
    customEndType, setCustomEndType,
  } = useCart()

  const livePO = purchaseOrders.find(p => p.id === id)
  if (!livePO) notFound()

  const [po, setPO] = useState(livePO)
  const prevDrawerOpen = useRef(false)

  const isDraft = po.status === 'Draft'

  useEffect(() => {
    const t = setTimeout(() => {
      setSelectedPOId(po.id)
    }, 0)
    return () => clearTimeout(t)
  }, [po.id])

  // When drawer closes, re-read the live PO to pick up any cart changes
  useEffect(() => {
    if (prevDrawerOpen.current && !isDrawerOpen) {
      const updated = purchaseOrders.find(p => p.id === id)
      if (updated) setPO({ ...updated })
    }
    prevDrawerOpen.current = isDrawerOpen
  }, [isDrawerOpen])

  // Group line items by vendor
  const itemsByVendor = vendors.map(vendor => {
    const items = po.lineItems.filter(li => li.vendorId === vendor.id)
    if (items.length === 0) return null
    const vendorSubtotal = items.reduce((sum, li) => sum + (li.unitPrice * li.quantity), 0)
    const itemsWithProducts = items.map(li => {
      const product = vendor.products.find(p => p.id === li.productId)
      return { ...li, product, vendor }
    }).filter(li => li.product)
    return { vendor, items: itemsWithProducts, vendorSubtotal }
  }).filter(Boolean) as Array<{
    vendor: typeof vendors[0]
    items: any[]
    vendorSubtotal: number
  }>

  const subtotal = itemsByVendor.reduce((sum, g) => sum + g.vendorSubtotal, 0)
  const processingFee = subtotal * 0.10
  const total = subtotal + processingFee

  const cardClass = "bg-white border border-[#e8e8e8] rounded-xl shadow-[2px_2px_10px_0px_rgba(156,153,153,0.25)]"

  return (
    <div className="flex flex-1 min-h-0 bg-white" style={{ fontFamily: 'var(--font-lato), Arial, sans-serif' }}>

      <Sidebar />

      {/* Main content — full width on mobile */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Sticky header with breadcrumb */}
        <div className="flex items-center justify-between gap-2 px-4 md:px-9 py-3 md:py-4 border-b border-[#e8e8e8] bg-white shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-[13px] min-w-0 flex-1">
            <Link href="/purchase-orders" className="font-bold text-[#28ba93] hover:text-[#035257] transition-colors no-min-h shrink-0">
              Purchase Orders
            </Link>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="shrink-0">
              <path d="M1 1l4 4-4 4" stroke="#a1a4aa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-[#1f1f1f] truncate">{po.id}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop: full "View Draft PO" button — draft only */}
            {isDraft && (
              <button
                onClick={() => { syncItemsFromPO(po.id); setDrawerOpen(true) }}
                className="hidden md:flex bg-[#28ba93] hover:bg-[#22a882] transition-colors items-center gap-2 rounded-full px-4 h-[38px] text-white font-bold text-[13px] whitespace-nowrap"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <path d="M2 3h2l2.4 9.6A1 1 0 007.36 14h7.28a1 1 0 00.96-.72L17 7H5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="17" r="1" fill="white"/>
                  <circle cx="14" cy="17" r="1" fill="white"/>
                </svg>
                View Draft PO
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-9 py-4 md:py-6">

          {/* PO Details card */}
          <div className={`${cardClass} p-5 mb-6`}>

            {/* Desktop card header — hidden on mobile */}
            <div className="hidden md:flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-normal text-[#1f1f1f] mb-1">Purchase Order Details</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-[#777]">{po.id}</span>
                  <POStatusBadge status={po.status} />
                </div>
                {!isDraft && (
                  <p className="text-[11px] text-[#a1a4aa] mt-1.5 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="1" y="4.5" width="9" height="6" rx="1" stroke="#a1a4aa" strokeWidth="1.1"/>
                      <path d="M3.5 4.5V3a2 2 0 014 0v1.5" stroke="#a1a4aa" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    This PO is locked — no further changes can be made
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="border border-[#035257] text-[#035257] text-[11px] font-bold rounded-full px-3 h-[30px] hover:bg-[#f0fafa] transition-colors whitespace-nowrap">
                  Download CSV
                </button>
                {isDraft && (
                  <button
                    onClick={() => {
                      syncItemsFromPO(po.id)
                      router.push('/products')
                    }}
                    className="bg-[#28ba93] text-white text-[11px] font-bold rounded-full px-3 h-[30px] hover:bg-[#22a882] transition-colors whitespace-nowrap"
                  >
                    + Add to Order
                  </button>
                )}
                <PODropdownMenu
                  items={[
                    ...(isDraft ? [{
                      label: 'Add more to PO',
                      icon: 'add' as const,
                      onClick: () => {
                        syncItemsFromPO(po.id)
                        router.push('/products')
                      }
                    }] : []),
                    {
                      label: 'Duplicate PO',
                      icon: 'duplicate' as const,
                      onClick: () => console.log('duplicate')
                    },
                    {
                      label: 'Request support',
                      icon: 'support' as const,
                      onClick: () => console.log('support')
                    },
                    ...(po.status !== 'Delivered' && po.status !== 'Cancelled' ? [{
                      label: 'Cancel PO',
                      icon: 'cancel' as const,
                      danger: true,
                      onClick: () => console.log('cancel')
                    }] : [])
                  ]}
                />
              </div>
            </div>

            {/* Mobile card header — hidden on desktop */}
            <div className="md:hidden flex items-center justify-between mb-4">
              <POStatusBadge status={po.status} />
              <div className="flex items-center gap-2 shrink-0">
                <button className="no-min-h h-[34px] px-3 text-[12px] font-bold rounded-full border border-[#035257] text-[#035257] bg-white flex items-center gap-1.5 hover:bg-[#f0fafa] transition-colors whitespace-nowrap">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  CSV
                </button>
                <PODropdownMenu
                  items={[
                    ...(isDraft ? [{
                      label: 'Add Items to Order',
                      icon: 'add' as const,
                      onClick: () => {
                        syncItemsFromPO(po.id)
                        router.push('/products')
                      }
                    }] : []),
                    {
                      label: 'Duplicate PO',
                      icon: 'duplicate' as const,
                      onClick: () => console.log('duplicate')
                    },
                    {
                      label: 'Request support',
                      icon: 'support' as const,
                      onClick: () => console.log('support')
                    },
                    ...(po.status !== 'Delivered' && po.status !== 'Cancelled' ? [{
                      label: 'Cancel PO',
                      icon: 'cancel' as const,
                      danger: true,
                      onClick: () => console.log('cancel')
                    }] : [])
                  ]}
                />
              </div>
            </div>

            {/* Two-column info grid — stacks on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-4">

              {/* LEFT — Buyer + Shipping */}
              <div className="bg-[#fafafa] rounded-xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e8e8e8] flex items-center justify-center text-[12px] font-bold text-[#777] shrink-0">
                    JH
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1f1f1f] leading-tight">Johns Hopkins University</p>
                    <p className="text-[12px] text-[#777]">Charles Street Market</p>
                  </div>
                </div>
                <div className="h-px bg-[#e8e8e8]" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-1.5">Delivery Address</p>
                    <p className="text-[13px] text-[#1f1f1f] leading-relaxed">3339 N Charles St<br/>Baltimore, MD 21218</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-1.5">Contact</p>
                    <p className="text-[13px] text-[#1f1f1f] leading-relaxed">Christopher Land<br/>cland5@jh.edu<br/>(443) 756-7024</p>
                  </div>
                </div>
              </div>

              {/* RIGHT — Order meta + Delivery */}
              <div className="bg-[#fafafa] rounded-xl p-4 flex flex-col">

                {/* 2×2 meta grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-1">Ordering Window</p>
                    <p className="text-[13px] font-bold text-[#1f1f1f]">
                      {po.dateRange ? `${po.dateRange.start} – ${po.dateRange.end}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-1">Cureator</p>
                    <p className="text-[13px] font-bold text-[#1f1f1f]">{po.cureatorName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-1">Total PO Amount</p>
                    <p className="text-[22px] font-black text-[#1f1f1f] leading-none">${total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-1">Vendors on this PO</p>
                    <div className="flex flex-col gap-0.5">
                      {itemsByVendor.map(g => g && (
                        <p key={g.vendor.id} className="text-[13px] font-bold text-[#1f1f1f]">{g.vendor.name}</p>
                      ))}
                      {itemsByVendor.length === 0 && <p className="text-[13px] text-[#777]">—</p>}
                    </div>
                  </div>
                </div>

                {/* Divider before delivery */}
                <div className="h-px bg-[#e8e8e8] mb-4" />

                {/* Delivery Date section */}
                <div>
                  <p className="text-[10px] font-bold text-[#777] uppercase tracking-wide mb-2">Delivery Date</p>

                  {isDraft ? (
                    <div className="flex flex-col gap-2">

                      {/* Delivery week row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#777] w-[90px] shrink-0">Delivery week</span>
                        <select
                          value={selectedDeliveryWeek}
                          onChange={e => setSelectedDeliveryWeek(e.target.value)}
                          className="flex-1 min-w-0 text-[12px] border border-[#e8e8e8] rounded-lg px-2 h-[30px] bg-white text-[#444955] outline-none cursor-pointer hover:border-[#28ba93] focus:border-[#28ba93] transition-colors"
                        >
                          {getEightWednesdays(selectedDeliveryWeek).map(({ iso, label }) => (
                            <option key={iso} value={iso}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Repeat row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#777] w-[90px] shrink-0">Repeat</span>
                        <select
                          value={repeatMode}
                          onChange={e => setRepeatMode(e.target.value as typeof repeatMode)}
                          className="flex-1 min-w-0 text-[12px] border border-[#e8e8e8] rounded-lg px-2 h-[30px] bg-white text-[#444955] outline-none cursor-pointer hover:border-[#28ba93] focus:border-[#28ba93] transition-colors"
                        >
                          <option value="none">Does not repeat</option>
                          <option value="weekly">Weekly every Wednesday</option>
                          <option value="biweekly">Bi-weekly (every 2 weeks)</option>
                          <option value="monthly">Monthly (first Wednesday)</option>
                          <option value="custom">Custom...</option>
                        </select>
                      </div>

                      {/* Custom expansion */}
                      {repeatMode === 'custom' && (
                        <div className="bg-white border border-[#e8e8e8] rounded-xl p-3 flex flex-col gap-2 ml-[98px]">
                          <div className="flex items-center gap-2 text-[12px] text-[#444955]">
                            <span>Every</span>
                            <select className="w-[46px] border border-[#e8e8e8] rounded-lg h-[26px] px-1 text-[12px] text-center bg-white outline-none">
                              {[1, 2, 3, 4, 6, 8].map(n => <option key={n}>{n}</option>)}
                            </select>
                            <select className="border border-[#e8e8e8] rounded-lg h-[26px] px-2 text-[12px] bg-white outline-none">
                              <option>Week(s)</option>
                              <option>Month(s)</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-[#444955]">
                            <span className="w-7">Ends</span>
                            <select
                              value={customEndType}
                              onChange={e => setCustomEndType(e.target.value as typeof customEndType)}
                              className="border border-[#e8e8e8] rounded-lg h-[26px] px-2 text-[12px] bg-white outline-none"
                            >
                              <option value="never">Never</option>
                              <option value="date">On date</option>
                              <option value="after">After N deliveries</option>
                            </select>
                            {customEndType === 'date' && (
                              <input type="date" className="border border-[#e8e8e8] rounded-lg h-[26px] px-2 text-[12px] bg-white outline-none flex-1" />
                            )}
                            {customEndType === 'after' && (
                              <div className="flex items-center gap-1 text-[12px]">
                                <input type="number" min="1" defaultValue={4}
                                  className="w-[42px] border border-[#e8e8e8] rounded-lg h-[26px] px-1 text-center bg-white outline-none" />
                                <span>deliveries</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recurring badge */}
                      {repeatMode !== 'none' && (
                        <div className="ml-[98px] inline-flex items-center gap-1.5 bg-[#d4f5e9] text-[#065f46] text-[11px] font-bold rounded-full px-3 py-1 w-fit">
                          <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                            <path d="M1 5a4 4 0 108 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M7 3l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Recurring
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[14px] font-bold text-[#1f1f1f]">
                      {po.deliveryDate ? formatDeliveryFull(po.deliveryDate) : '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vendor line item cards */}
          {itemsByVendor.map(group => {
            const { vendor, items, vendorSubtotal } = group
            return (
              <div
                key={vendor.id}
                className={`${cardClass} overflow-hidden mb-4`}
              >
                {/* Vendor header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
                  <div className="flex items-center gap-3">
                    <div className="w-[50px] h-[50px] rounded-full bg-[#f7f5ef] flex items-center justify-center overflow-hidden border border-[#e8e8e8] shrink-0">
                      <img
                        src={vendor.logo}
                        alt={vendor.name}
                        className="w-full h-full object-contain p-1"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-[18px] font-normal text-[#1f1f1f]">{vendor.name}</p>
                      <p className="text-[11px] text-[#777]">Vendor subtotal: ${vendorSubtotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <PODropdownMenu
                    items={[
                      ...(isDraft ? [
                        {
                          label: 'Add more to PO',
                          icon: 'add' as const,
                          onClick: () => {
                            setSelectedPOId(po.id)
                            router.push('/products')
                          }
                        },
                        {
                          label: 'Edit order',
                          icon: 'edit' as const,
                          onClick: () => console.log('edit vendor order')
                        }
                      ] : []),
                      {
                        label: 'Duplicate order',
                        icon: 'duplicate' as const,
                        onClick: () => console.log('duplicate vendor order')
                      },
                      ...(isDraft ? [{
                        label: 'Delete from PO',
                        icon: 'delete' as const,
                        danger: true,
                        onClick: () => console.log('delete vendor from PO')
                      }] : [])
                    ]}
                  />
                </div>

                {/* Column headers — desktop only */}
                <div className="hidden md:grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-0 px-5 py-2 bg-[#fafafa] border-b border-[#e8e8e8]">
                  {['Product', 'Quantity', 'Unit Price', 'Delivery Fee', 'Extended Cost'].map(h => (
                    <p key={h} className="text-[11px] font-bold text-[#777] uppercase tracking-wide">{h}</p>
                  ))}
                </div>

                {/* Line items */}
                {items.map((item: any, idx: number) => {
                  if (!item.product) return null
                  const extendedCost = item.unitPrice * item.quantity
                  return (
                    <div key={idx} className="border-b border-[#f0f0f0] last:border-0">
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-0 px-5 py-4 bg-[#fbf9f6] items-start">
                        <div>
                          <p className="text-[13px] font-bold text-[#444955]">{item.product.name}</p>
                          <p className="text-[11px] text-[#777] mt-0.5">
                            ID #{item.product.id}
                            {item.product.upc ? ` · UPC: ${item.product.upc}` : ''}
                          </p>
                        </div>
                        <p className="text-[13px] text-[#444955] pt-0.5">{item.quantity} {item.unit}</p>
                        <p className="text-[13px] text-[#444955] pt-0.5">${item.unitPrice.toFixed(2)}</p>
                        <p className="text-[13px] text-[#777] pt-0.5">
                          {item.deliveryFee != null ? `$${item.deliveryFee.toFixed(2)}` : '—'}
                        </p>
                        <p className="text-[13px] font-bold text-[#1f1f1f] pt-0.5">${extendedCost.toFixed(2)}</p>
                      </div>

                      {/* Mobile stacked card */}
                      <div className="md:hidden px-4 py-3 bg-[#fbf9f6]">
                        <p className="text-[13px] font-bold text-[#444955] mb-1">{item.product.name}</p>
                        <p className="text-[11px] text-[#777] mb-2">
                          {item.quantity} {item.unit} · ${item.unitPrice.toFixed(2)}/unit
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-[#777]">Extended Cost</p>
                          <p className="text-[13px] font-bold text-[#1f1f1f]">${extendedCost.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Delivery + note row */}
                      {(item.deliverySchedule || item.orderNote) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 md:px-5 py-3 bg-[#fafafa] border-t border-[#f0f0f0]">
                          {item.deliverySchedule && (
                            <div>
                              <p className="text-[11px] font-bold text-[#777] uppercase tracking-wide mb-1">Delivery Schedule</p>
                              <p className="text-[12px] text-[#444955]">{item.deliverySchedule}</p>
                            </div>
                          )}
                          {item.orderNote && (
                            <div>
                              <p className="text-[11px] font-bold text-[#777] uppercase tracking-wide mb-1">Order Note</p>
                              <p className="text-[12px] text-[#444955] italic">"{item.orderNote}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Empty state for POs with no line items */}
          {itemsByVendor.length === 0 && (
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center mb-4">
              <p className="text-[14px] font-bold text-[#444955]">No items on this purchase order</p>
              <p className="text-[12px] text-[#777] mt-1">Add products to get started</p>
              <button
                onClick={() => {
                  setSelectedPOId(po.id)
                  router.push('/products')
                }}
                className="mt-4 bg-[#28ba93] text-white text-[13px] font-bold rounded-full px-6 h-[36px] hover:bg-[#22a882] transition-colors"
              >
                + Add Products
              </button>
            </div>
          )}

          {/* Totals section */}
          {itemsByVendor.length > 0 && (
            <div className={`${cardClass} overflow-hidden mb-8`}>
              {itemsByVendor.map(g => (
                <div key={g.vendor.id} className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0]">
                  <span className="text-[13px] text-[#777]">{g.vendor.name} subtotal</span>
                  <span className="text-[13px] font-bold text-[#1f1f1f]">${g.vendorSubtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#777]">Cureate Processing Fee (10%)</span>
                <span className="text-[13px] font-bold text-[#1f1f1f]">${processingFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-[#fafafa] rounded-b-xl">
                <span className="text-[14px] font-bold text-[#1f1f1f]">Total Purchase Order Amount</span>
                <span className="text-[20px] font-black text-[#1f1f1f]">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
