'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cartContext'
import { AnimatePresence, motion } from 'framer-motion'

const NAV_ITEMS = [
  { label: 'Dashboard',       href: '/dashboard' },
  { label: 'Products',        href: '/products' },
  { label: 'Purchase Orders', href: '/purchase-orders' },
  { label: 'Vendors',         href: '/vendors' },
  { label: 'Categories',      href: '/categories' },
  { label: 'Requests',        href: '/requests' },
]

export default function MobileNav() {
  const [mounted, setMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const { items, setDrawerOpen: openCart } = useCart()
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  // Hide cart on all purchase-orders routes (management context, not shopping)
  const isOnPORoute = pathname?.startsWith('/purchase-orders')

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <>
      {/* ── STICKY TOP BAR ── */}
      <header className="md:hidden sticky top-0 z-40 bg-[#1f1f1f] border-b border-[#333] shrink-0">
        <div className="flex items-center justify-between px-5 py-3">

          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="no-min-h w-8 h-8 flex flex-col justify-center gap-[5px] shrink-0"
            aria-label="Open menu"
          >
            <span className="block h-[2px] w-6 bg-white rounded-full" />
            <span className="block h-[2px] w-6 bg-white rounded-full" />
            <span className="block h-[2px] w-4 bg-white rounded-full" />
          </button>

          {/* Centered logo */}
          <Link href="/products" className="flex items-center gap-2 no-min-h">
            <img src="/cureate-logo.svg" alt="Cureate Connect" className="h-[32px] w-auto" />
          </Link>

          {/* Cart button — hidden on all purchase-orders routes */}
          {!isOnPORoute ? (
            <button
              onClick={() => openCart(true)}
              className="no-min-h w-8 h-8 flex items-center justify-center bg-[#28ba93] rounded-full relative shrink-0"
              aria-label="View cart"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#1f1f1f] text-[9px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          ) : (
            <div className="w-8 shrink-0" />
          )}
        </div>
      </header>

      {/* ── SLIDE-OUT DRAWER ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              className="md:hidden fixed top-0 left-0 h-full w-[280px] bg-[#1f1f1f] z-50 flex flex-col"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
                <Link href="/products" onClick={() => setDrawerOpen(false)} className="no-min-h">
                  <img src="/cureate-logo.svg" alt="Cureate Connect" className="h-[28px] w-auto" />
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="no-min-h w-8 h-8 flex items-center justify-center text-[#777] hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-4">
                {NAV_ITEMS.map(item => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-5 py-3 text-[15px] transition-colors no-min-h ${
                        isActive
                          ? 'bg-[#363636] text-white font-bold'
                          : 'text-[#aaa] hover:text-white hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {item.label}
                      {item.label === 'Purchase Orders' && (
                        <span className="text-[11px] text-[#28ba93] font-bold">Drafts · Submitted</span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* User profile */}
              <div className="px-5 py-4 border-t border-[#333]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#363636] flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                    N
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">Johns Hopkins University</p>
                    <p className="text-[11px] text-[#777]">buyer@jhu.edu</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
