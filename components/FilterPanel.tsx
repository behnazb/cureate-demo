'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { filterConfig } from '@/lib/filterConfig'
import { t } from '@/lib/tokens'

type AdvancedFilters = Record<string, string[]>
type PriceRange = { min: number; max: number }

type FilterPanelProps = {
  open: boolean
  onClose: () => void
  activeFilters: AdvancedFilters
  priceRange: PriceRange
  onChange: (filters: AdvancedFilters) => void
  onPriceChange: (range: PriceRange) => void
  onClearAll: () => void
  activeCount: number
}

export default function FilterPanel({
  open, onClose, activeFilters, priceRange,
  onChange, onPriceChange, onClearAll, activeCount
}: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    Object.fromEntries(filterConfig.advanced.map(f => [f.id, f.collapsedByDefault]))
  )

  // Evaluated at render time — safe in 'use client' component
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleCheckbox = (filterId: string, optionId: string) => {
    const current = activeFilters[filterId] ?? []
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId]
    onChange({ ...activeFilters, [filterId]: updated })
  }

  // Group advanced filters by section
  const sections = filterConfig.advanced.reduce((acc, filter) => {
    const section = filter.section ?? 'Other'
    if (!acc[section]) acc[section] = []
    acc[section].push(filter)
    return acc
  }, {} as Record<string, typeof filterConfig.advanced>)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — full screen on mobile, left slide-in on desktop */}
          <motion.div
            className="fixed z-50 bg-white overflow-hidden flex flex-col inset-0 md:inset-y-0 md:left-0 md:right-auto md:w-[380px] md:shadow-[4px_0_24px_rgba(0,0,0,0.1)]"
            initial={isMobile ? { y: '100%' } : { x: '-100%' }}
            animate={{ y: 0, x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8] shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-black text-[#1f1f1f]">Filters</h2>
                {activeCount > 0 && (
                  <span className="bg-[#28ba93] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[12px] text-[#035257] font-bold hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="#1f1f1f" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(sections).map(([section, filters]) => (
                <div key={section}>
                  {/* Section label */}
                  <div className="px-5 pt-5 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a4aa]">{section}</p>
                  </div>

                  {filters.map(filter => {
                    const isCollapsed = collapsed[filter.id]
                    const activeInGroup = (activeFilters[filter.id] ?? []).length

                    return (
                      <div key={filter.id} className="px-5 mb-4">
                        {/* Filter group header */}
                        <button
                          className="w-full flex items-center justify-between mb-2"
                          onClick={() => toggleCollapse(filter.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[#1f1f1f]">{filter.label}</span>
                            {activeInGroup > 0 && (
                              <span className="bg-[#035257] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                                {activeInGroup}
                              </span>
                            )}
                          </div>
                          <span className={`text-[#a1a4aa] text-[10px] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>▾</span>
                        </button>

                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {filter.control === 'checkbox-group' && (
                                <div className="flex flex-col gap-1">
                                  {filter.options?.map(option => {
                                    const isChecked = (activeFilters[filter.id] ?? []).includes(option.id)
                                    return (
                                      <label
                                        key={option.id}
                                        className="flex items-center gap-2.5 py-1 cursor-pointer group"
                                      >
                                        <div
                                          onClick={() => toggleCheckbox(filter.id, option.id)}
                                          className={`
                                            w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all
                                            ${isChecked
                                              ? 'bg-[#28ba93] border-[#28ba93]'
                                              : 'border-[#a1a4aa] group-hover:border-[#28ba93]'
                                            }
                                          `}
                                        >
                                          {isChecked && <span className="text-white text-[10px] leading-none">✓</span>}
                                        </div>
                                        <span
                                          onClick={() => toggleCheckbox(filter.id, option.id)}
                                          className={`text-[13px] transition-colors ${isChecked ? 'text-[#035257] font-bold' : 'text-[#444955] group-hover:text-[#1f1f1f]'}`}
                                        >
                                          {option.label}
                                        </span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}

                              {filter.control === 'range' && (
                                <div className="pt-1 pb-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[12px] text-[#777]">
                                      ${priceRange.min.toFixed(2)}
                                    </span>
                                    <span className="text-[12px] text-[#777]">
                                      ${priceRange.max.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="relative h-6 flex items-center">
                                    <div className="h-1.5 bg-[#e8e8e8] rounded-full w-full relative">
                                      <div
                                        className="absolute h-full bg-[#28ba93] rounded-full"
                                        style={{
                                          left: `${(priceRange.min / 50) * 100}%`,
                                          right: `${100 - (priceRange.max / 50) * 100}%`
                                        }}
                                      />
                                    </div>
                                    <input
                                      type="range"
                                      min={0} max={50} step={0.5}
                                      value={priceRange.min}
                                      onChange={e => onPriceChange({ ...priceRange, min: parseFloat(e.target.value) })}
                                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                    <input
                                      type="range"
                                      min={0} max={50} step={0.5}
                                      value={priceRange.max}
                                      onChange={e => onPriceChange({ ...priceRange, max: parseFloat(e.target.value) })}
                                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                  </div>
                                  <p className="text-[11px] text-[#a1a4aa] mt-2 text-center">
                                    Drag to set price range
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Apply CTA */}
            <div className="shrink-0 px-5 py-4 border-t border-[#e8e8e8] bg-white">
              <button
                onClick={onClose}
                className="w-full h-[52px] bg-[#28ba93] text-white font-bold text-[15px] rounded-full hover:bg-[#22a882] transition-colors"
              >
                Apply Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
