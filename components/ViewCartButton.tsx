'use client'
import { useCart } from '@/lib/cartContext'

export default function ViewCartButton() {
  const { getTotalItems, setDrawerOpen, hasActivePO } = useCart()
  const totalItems = getTotalItems()

  const label = hasActivePO ? 'View Draft PO' : 'Add to Draft PO'

  return (
    <button
      onClick={() => setDrawerOpen(true)}
      className="no-min-h bg-[#28ba93] hover:bg-[#22a882] transition-colors flex items-center gap-2 rounded-full px-4 h-[38px] text-white font-bold text-[13px] whitespace-nowrap"
    >
      {label}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>{totalItems}</span>
    </button>
  )
}
