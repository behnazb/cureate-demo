'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type PODropdownItem = {
  label: string
  icon: 'add' | 'duplicate' | 'edit' | 'support' | 'delete' | 'cancel'
  danger?: boolean
  onClick: () => void
}

export default function PODropdownMenu({ items }: { items: PODropdownItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const icons = {
    add: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 3h7a2 2 0 012 2v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <rect x="1" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
    duplicate: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    edit: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 10l2-1 7-7-1-1-7 7-1 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    support: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5.5 5.5a1.5 1.5 0 013 .5c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="7" cy="10.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
    delete: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    cancel: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        className="w-7 h-7 rounded-full bg-[#f0f0f0] hover:bg-[#e0e0e0] flex items-center justify-center text-[#777] transition-colors text-[14px] tracking-wider"
      >
        ···
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-9 bg-white border border-[#e8e8e8] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 overflow-hidden min-w-[200px]"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={e => {
                  e.stopPropagation()
                  item.onClick()
                  setOpen(false)
                }}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors
                  border-b border-[#f0f0f0] last:border-0
                  ${item.danger
                    ? 'text-[#a33500] hover:bg-[#fff5f2]'
                    : 'text-[#444955] hover:bg-[#f7f5ef]'
                  }
                `}
              >
                <span className={item.danger ? 'text-[#a33500]' : 'text-[#777]'}>
                  {icons[item.icon]}
                </span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
