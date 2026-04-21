'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { t } from '@/lib/tokens'

const COLORS = {
  primaryTeal: '#28ba93',
  sidebarBg: '#1f1f1f',
  activeNavBg: '#363636',
} as const

type SubItem = { label: string; href: string; tab: string }

type NavLink = {
  label: string
  icon: string
  href: string
  badge?: string
  subItems?: SubItem[]
}

const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard',       icon: '/icon_dashboard.svg',        href: '/' },
  { label: 'Buyers',          icon: '/icon_buyers.svg',            href: '#' },
  { label: 'Vendors',         icon: '/icon_vendors.svg',           href: '/vendors' },
  { label: 'All Orders',      icon: '/icon_all_orders.svg',        href: '#' },
  {
    label: 'Purchase Orders',
    icon: '/icon_purchase_orders.svg',
    href: '/purchase-orders',
    subItems: [
      { label: 'Drafts',    href: '/purchase-orders?tab=draft',     tab: 'draft'     },
      { label: 'Submitted', href: '/purchase-orders?tab=submitted', tab: 'submitted' },
    ],
  },
  { label: 'Products',        icon: '/icon_products.svg',          href: '/products' },
  { label: 'Categories',      icon: '/icon_categories.svg',        href: '#' },
  { label: 'Requests',        icon: '/icon_requests.svg',          href: '#' },
]

// Isolated component that uses useSearchParams — must be in Suspense
function POSubNav({ subItems }: { subItems: SubItem[] }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') ?? ''
  return (
    <div className="flex flex-col gap-0.5 mt-0.5 ml-7">
      {subItems.map(sub => {
        const subActive = currentTab === sub.tab
        return (
          <Link
            key={sub.label}
            href={sub.href}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-white transition-colors"
            style={{
              fontSize: '12px',
              backgroundColor: subActive ? '#2a2a2a' : 'transparent',
              opacity: subActive ? 1 : 0.55,
            }}
          >
            <div
              className="w-1 h-1 rounded-full shrink-0"
              style={{ backgroundColor: subActive ? COLORS.primaryTeal : 'currentColor' }}
            />
            {sub.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '#') return false
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden md:flex relative z-[60] h-screen flex-col justify-between shrink-0 py-5 px-3"
      style={{ backgroundColor: COLORS.sidebarBg, width: t.w220 }}
    >
      <div>
        <div className="px-3 mb-6">
          <img src="/cureate-logo.svg" alt="Cureate Connect" className="w-[126px] h-auto mb-2" />
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV_LINKS.map(({ label, icon, href, badge, subItems }) => {
            const active = isActive(href)
            return (
              <div key={label}>
                <Link
                  href={href}
                  className="flex flex-row items-center gap-3 px-3 py-2 rounded text-white text-sm transition-colors"
                  style={{
                    backgroundColor: active ? COLORS.activeNavBg : 'transparent',
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  <img src={icon} alt="" className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  {badge && (
                    <span className="ml-auto bg-[#28ba93] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                  {subItems && (
                    <svg
                      viewBox="0 0 7 4" fill="none"
                      className={`ml-auto w-[7px] h-[4px] transition-transform duration-200 ${active ? 'rotate-180' : ''}`}
                    >
                      <path d="M1 1l2.5 2L6 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </Link>

                {subItems && active && (
                  <Suspense>
                    <POSubNav subItems={subItems} />
                  </Suspense>
                )}
              </div>
            )
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2 px-3 pb-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: COLORS.primaryTeal }}
        >
          JH
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-xs font-bold leading-tight truncate">Johns Hopkins University</span>
          <span className="text-white text-[10px] opacity-60 truncate">buyer@jhu.edu</span>
        </div>
      </div>
    </aside>
  )
}
