'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Option = { id: string; label: string }

type FilterDropdownProps = {
  label: string
  defaultLabel: string
  options: Option[]
  selection: 'single' | 'multiple'
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function FilterDropdown({
  label, defaultLabel, options, selection, selected, onChange
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false)
        setDropdownStyle({})
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasSelection = selected.length > 0 &&
    !selected.includes('all-vendors') &&
    !selected.includes('all-locations')

  const displayLabel = () => {
    if (!hasSelection) return defaultLabel
    if (selection === 'single') {
      return options.find(o => o.id === selected[0])?.label ?? defaultLabel
    }
    return selected.length === 1
      ? options.find(o => o.id === selected[0])?.label ?? defaultLabel
      : `${selected.length} selected`
  }

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
      })
    } else if (open) {
      setDropdownStyle({})
    }
    setOpen(prev => !prev)
  }

  const handleSelect = (id: string) => {
    if (selection === 'single') {
      onChange([id])
      setOpen(false)
      setDropdownStyle({})
    } else {
      onChange(
        selected.includes(id)
          ? selected.filter(s => s !== id)
          : [...selected, id]
      )
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className={`
          flex items-center gap-1.5 h-[30px] rounded-full px-3 text-[13px] font-bold
          transition-all duration-150 whitespace-nowrap
          ${hasSelection
            ? 'bg-[#035257] text-white'
            : 'bg-white text-[#377b82] hover:bg-[#f0fafa]'
          }
        `}
      >
        {displayLabel()}
        {hasSelection && selection === 'multiple' && (
          <span className="bg-white/30 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {selected.length}
          </span>
        )}
        <span className={`text-[8px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={dropdownStyle}
            className="absolute top-[36px] left-0 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e8e8e8] z-[200] min-w-[180px] overflow-hidden"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {options.map(option => {
              const isSelected = selected.includes(option.id)
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-left text-[12px]
                    transition-colors hover:bg-[#f7f5ef]
                    ${isSelected ? 'text-[#035257] font-bold' : 'text-[#444955]'}
                  `}
                >
                  <span>{option.label}</span>
                  {selection === 'multiple' && (
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-3
                      ${isSelected ? 'bg-[#28ba93] border-[#28ba93]' : 'border-[#a1a4aa]'}
                    `}>
                      {isSelected && (
                        <img
                          src="/icons/icon_check.svg"
                          alt=""
                          className="w-[10px] h-[10px] brightness-0 invert"
                        />
                      )}
                    </div>
                  )}
                  {selection === 'single' && isSelected && (
                    <img
                      src="/icons/icon_check.svg"
                      alt=""
                      className="w-[11px] h-[11px]"
                      style={{ filter: 'invert(42%) sepia(93%) saturate(456%) hue-rotate(127deg) brightness(95%) contrast(86%)' }}
                    />
                  )}
                </button>
              )
            })}
            {hasSelection && (
              <>
                <div className="border-t border-[#f0f0f0] mx-3" />
                <button
                  onClick={() => { onChange([]); setOpen(false); setDropdownStyle({}) }}
                  className="w-full px-4 py-2.5 text-left text-[11px] text-[#a1a4aa] hover:text-[#444955] transition-colors"
                >
                  Clear selection
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
