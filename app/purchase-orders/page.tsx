'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { purchaseOrders, POStatus } from '@/lib/purchaseOrdersData'
import POStatusBadge from '@/components/POStatusBadge'
import PODropdownMenu from '@/components/PODropdownMenu'
import Sidebar from '@/components/Sidebar'
import { useCart } from '@/lib/cartContext'

function formatDeliveryDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TABS: { label: string; value: string; statuses: POStatus[] }[] = [
  { label: 'Draft',       value: 'draft',       statuses: ['Draft']       },
  { label: 'In Review',   value: 'in-review',   statuses: ['In Review']   },
  { label: 'Processing',  value: 'processing',  statuses: ['Processing']  },
  { label: 'Confirmed',   value: 'confirmed',   statuses: ['Confirmed']   },
  { label: 'Delivered',   value: 'delivered',   statuses: ['Delivered']   },
  { label: 'Invoiced',    value: 'invoiced',    statuses: ['Invoiced']    },
  { label: 'Paid',        value: 'paid',        statuses: ['Paid']        },
  { label: 'Cancelled',   value: 'cancelled',   statuses: ['Cancelled']   },
]

// Mobile: first 3 shown inline; rest surface in the "More" bottom sheet
const MOBILE_PRIMARY = TABS.slice(0, 3)
const MOBILE_SECONDARY = TABS.slice(3)

const DATE_RANGES = [
  { label: 'Last 7 days',   value: '7'   },
  { label: 'Last 30 days',  value: '30'  },
  { label: 'Last 90 days',  value: '90'  },
  { label: 'All time',      value: 'all' },
]

function PurchaseOrdersContent() {
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = moreSheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [moreSheetOpen])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSelectedPOId } = useCart()

  const rawTab = searchParams.get('tab') ?? 'draft'
  // 'submitted' from sidebar sub-nav maps to 'in-review'
  const activeTab = rawTab === 'submitted' ? 'in-review' : rawTab
  const tabConfig = TABS.find(t => t.value === activeTab) ?? TABS[0]

  const filtered = purchaseOrders.filter(po => {
    const matchesTab = tabConfig.statuses.includes(po.status)
    const matchesSearch =
      po.id.toLowerCase().includes(search.toLowerCase()) ||
      po.status.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="flex flex-1 min-h-0 bg-white" style={{ fontFamily: 'var(--font-lato), Arial, sans-serif' }}>

      <Sidebar />

      {/* Main content — full width on mobile */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header — hidden on mobile */}
        <div className="hidden md:flex items-center justify-between px-9 py-4 border-b border-[#e8e8e8] bg-white shrink-0">
          <div className="flex items-center gap-5">
            <h1 className="text-[20px] font-bold text-[#1f1f1f] whitespace-nowrap">Purchase Orders</h1>
            <div className={`
              flex items-center gap-2 h-[38px] bg-white border rounded-full px-[10px] w-[300px]
              transition-all duration-200
              ${focused
                ? 'border-[#28ba93] shadow-[0_0_0_3px_rgba(40,186,147,0.15)]'
                : 'border-[#a1a4aa] hover:border-[#777]'
              }
            `}>
              <img
                src="/icons/icon_search.svg"
                alt=""
                className={`w-[14px] h-[14px] shrink-0 transition-opacity ${focused ? 'opacity-100' : 'opacity-60'}`}
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search by number, name or date"
                className="flex-1 bg-transparent text-[13px] text-[#444955] placeholder-[#737780] outline-none"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => { setSearch(''); inputRef.current?.focus() }}
                    className="w-[16px] h-[16px] rounded-full bg-[#e8e8e8] flex items-center justify-center hover:bg-[#d0d0d0] transition-colors shrink-0"
                  >
                    <span className="text-[#777] text-[10px] leading-none">✕</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="no-min-h bg-[#28ba93] text-white text-[13px] font-bold rounded-full px-4 h-[38px] flex items-center gap-1 hover:bg-[#22a882] transition-colors"
            >
              + New Purchase Order
            </Link>
          </div>
        </div>

        {/* Desktop tabs + date filter — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 px-9 py-3 border-b border-[#e8e8e8] bg-white shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 shrink-0">
            {TABS.map(tab => {
              const isActive = tab.value === activeTab
              return (
                <Link
                  key={tab.value}
                  href={`/purchase-orders?tab=${tab.value}`}
                  className={`no-min-h px-4 h-[32px] rounded-full text-[12px] font-bold flex items-center transition-colors ${
                    isActive
                      ? 'bg-[#1f1f1f] text-white'
                      : 'text-[#777] hover:text-[#1f1f1f] hover:bg-[#f0f0f0]'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
          <div className="ml-auto">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="h-[32px] rounded-full border border-[#a1a4aa] px-3 text-[12px] text-[#444955] bg-white outline-none hover:border-[#777] transition-colors cursor-pointer appearance-none pr-7"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23777' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {DATE_RANGES.map(dr => (
                <option key={dr.value} value={dr.value}>{dr.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile segmented control — hidden on desktop */}
        <div className="md:hidden flex items-center gap-1.5 px-4 py-3 border-b border-[#e8e8e8] bg-white shrink-0">
          {MOBILE_PRIMARY.map(tab => {
            const isActive = tab.value === activeTab
            return (
              <Link
                key={tab.value}
                href={`/purchase-orders?tab=${tab.value}`}
                className={`no-min-h h-[34px] px-3 text-[12px] font-bold rounded-full whitespace-nowrap flex items-center transition-colors ${
                  isActive ? 'bg-[#1f1f1f] text-white' : 'text-[#777]'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
          {/* More button */}
          {(() => {
            const activeSecondary = MOBILE_SECONDARY.find(t => t.value === activeTab)
            return (
              <button
                onClick={() => setMoreSheetOpen(true)}
                className={`no-min-h h-[34px] px-3 text-[12px] font-bold rounded-full whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeSecondary
                    ? 'bg-[#1f1f1f] text-white'
                    : 'text-[#777] border border-[#e0e0e0]'
                }`}
              >
                {activeSecondary ? activeSecondary.label : 'More'}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )
          })()}
        </div>

        {/* More bottom sheet */}
        <AnimatePresence>
          {moreSheetOpen && (
            <>
              <motion.div
                className="md:hidden fixed inset-0 bg-black/40 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoreSheetOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)]"
              >
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 bg-[#e0e0e0] rounded-full" />
                </div>
                <div className="px-5 pb-2">
                  <h3 className="text-[14px] font-bold text-[#1f1f1f]">Filter by status</h3>
                </div>
                <div className="py-2">
                  {MOBILE_SECONDARY.map(tab => {
                    const isActive = tab.value === activeTab
                    return (
                      <Link
                        key={tab.value}
                        href={`/purchase-orders?tab=${tab.value}`}
                        onClick={() => setMoreSheetOpen(false)}
                        className={`w-full flex items-center justify-between px-5 py-3.5 text-[14px] font-bold no-min-h ${
                          isActive ? 'text-[#28ba93]' : 'text-[#1f1f1f]'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {isActive && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8l3 3 7-7" stroke="#28ba93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </Link>
                    )
                  })}
                </div>
                <div className="h-6" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile card list */}
        <div className="block md:hidden flex-1 overflow-y-auto py-3">
          {filtered.map(po => (
            <div
              key={po.id}
              onClick={() => {
                router.push(`/purchase-orders/${po.id}`)
              }}
              className="mx-4 mb-3 bg-white border border-[#e8e8e8] rounded-xl p-4 cursor-pointer active:bg-[#f7f5ef] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[14px] font-bold text-[#28ba93]">{po.id}</span>
                <POStatusBadge status={po.status} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#777]">
                    Delivery: {formatDeliveryDate(po.deliveryDate)}
                  </p>
                  {po.dateRange && (
                    <p className="text-[11px] text-[#777] mt-0.5">
                      {po.dateRange.start} – {po.dateRange.end}
                    </p>
                  )}
                </div>
                <span className="text-[16px] font-black text-[#1f1f1f]">${po.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-16 text-center">
              <p className="text-[14px] font-bold text-[#444955]">No purchase orders found</p>
              <p className="text-[12px] text-[#777] mt-1">
                {search ? 'Try adjusting your search' : `No ${tabConfig.label.toLowerCase()} purchase orders`}
              </p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#fafafa] z-10">
              <tr className="border-b border-[#e8e8e8]">
                <th className="text-left px-9 py-3 text-[12px] font-bold text-[#777] uppercase tracking-wide">PO Number</th>
                <th className="text-left px-3 py-3 text-[12px] font-bold text-[#777] uppercase tracking-wide">Date Range</th>
                <th className="text-left px-3 py-3 text-[12px] font-bold text-[#777] uppercase tracking-wide">Delivery Date</th>
                <th className="text-left px-3 py-3 text-[12px] font-bold text-[#777] uppercase tracking-wide">Total Amount</th>
                <th className="text-left px-3 py-3 text-[12px] font-bold text-[#777] uppercase tracking-wide">Status</th>
                <th className="px-3 py-3 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => (
                <tr
                  key={po.id}
                  onClick={() => {
                    router.push(`/purchase-orders/${po.id}`)
                  }}
                  className="border-b border-[#e8e8e8] hover:bg-[#f7f5ef] cursor-pointer transition-colors group"
                >
                  <td className="px-9 py-4">
                    <span className="text-[13px] font-bold text-[#28ba93] group-hover:text-[#035257] transition-colors">
                      {po.id}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-[13px] text-[#777]">
                    {po.dateRange ? `${po.dateRange.start} – ${po.dateRange.end}` : '—'}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-[#777]">
                    {formatDeliveryDate(po.deliveryDate)}
                  </td>
                  <td className="px-3 py-4 text-[13px] font-bold text-[#1f1f1f]">
                    ${po.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-4">
                    <POStatusBadge status={po.status} />
                  </td>
                  <td className="px-3 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <PODropdownMenu
                      items={[
                        {
                          label: 'Add more to PO',
                          icon: 'add',
                          onClick: () => {
                            setSelectedPOId(po.id)
                            router.push('/products')
                          }
                        },
                        {
                          label: 'Duplicate PO',
                          icon: 'duplicate',
                          onClick: () => console.log('duplicate', po.id)
                        },
                        {
                          label: 'Request support',
                          icon: 'support',
                          onClick: () => console.log('support', po.id)
                        },
                        ...(po.status !== 'Delivered' && po.status !== 'Cancelled' ? [{
                          label: 'Cancel PO',
                          icon: 'cancel' as const,
                          danger: true,
                          onClick: () => console.log('cancel', po.id)
                        }] : [])
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-9 py-16 text-center">
                    <p className="text-[14px] font-bold text-[#444955]">No purchase orders found</p>
                    <p className="text-[12px] text-[#777] mt-1">
                      {search ? 'Try adjusting your search' : `No ${tabConfig.label.toLowerCase()} purchase orders`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

function PurchaseOrdersLoading() {
  return (
    <div className="flex flex-1 min-h-0 bg-white">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Tabs skeleton */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8e8e8] shrink-0">
          {['Draft', 'In Review', 'Processing', 'Confirmed'].map(label => (
            <div key={label} className="h-[32px] px-4 rounded-full bg-[#f0f0f0] flex items-center">
              <span className="text-[12px] text-[#aaa] font-bold">{label}</span>
            </div>
          ))}
        </div>
        {/* Card skeletons */}
        <div className="flex-1 overflow-y-auto py-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="mx-4 mb-3 bg-white border border-[#e8e8e8] rounded-xl p-4">
              <div className="h-4 w-32 bg-[#f0f0f0] rounded mb-3" />
              <div className="h-3 w-24 bg-[#f0f0f0] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<PurchaseOrdersLoading />}>
      <PurchaseOrdersContent />
    </Suspense>
  )
}
