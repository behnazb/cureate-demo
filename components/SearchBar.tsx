'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { vendors } from '@/lib/data'
import { t } from '@/lib/tokens'

const searchIndex = vendors.flatMap(vendor => [
  {
    type: 'vendor' as const,
    id: vendor.id,
    name: vendor.name,
    subtitle: vendor.location,
    category: vendor.categories?.[0] ?? '',
    href: `/vendors/${vendor.id}`,
    image: vendor.logo,
  },
  ...vendor.products
    .filter((p: any) => !p.isShippingFee)
    .map((product: any) => ({
      type: 'product' as const,
      id: product.id,
      name: product.name,
      subtitle: vendor.name,
      category: product.category,
      href: `/vendors/${vendor.id}/products/${product.id}`,
      image: product.image,
      price: product.wholesaleUnitPrice,
      size: product.size,
    }))
])

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-[#28ba93]/20 text-[#035257] rounded-sm px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

export default function SearchBar({ placeholder = 'Search by products, vendor or SKU' }: { placeholder?: string }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState(-1)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = query.trim().length > 1
    ? searchIndex.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : []

  const vendorResults = results.filter(r => r.type === 'vendor')
  const productResults = results.filter(r => r.type === 'product')
  const showDropdown = focused && query.trim().length > 1

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setFocused(false)
        setSelected(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, -1))
    } else if (e.key === 'Enter' && selected >= 0 && results[selected]) {
      router.push(results[selected].href)
      setQuery(''); setFocused(false)
    } else if (e.key === 'Escape') {
      setFocused(false); setQuery('')
    }
  }

  const handleSelect = (href: string) => {
    router.push(href)
    setQuery(''); setFocused(false); setSelected(-1)
  }

  return (
    <div ref={containerRef} className="relative flex-1 w-full">

      {/* INPUT */}
      <div className={`
        flex items-center gap-[6px] bg-white border rounded-full pl-[10px] pr-[6px]
        transition-all duration-200 w-full
        ${focused
          ? 'border-[#28ba93] shadow-[0_0_0_3px_rgba(40,186,147,0.15)]'
          : 'border-[#a1a4aa] hover:border-[#777]'
        }
      `}
        style={{ height: t.h30 }}
      >
        <img
          src="/icons/icon_search.svg"
          alt=""
          className={`shrink-0 transition-opacity ${focused ? 'opacity-100' : 'opacity-60'}`}
          style={{ width: '14px', height: '14px' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(-1) }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[#444955] placeholder-[#737780] outline-none font-['Lato'] min-w-0"
          style={{ fontSize: t.text11 }}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="rounded-full bg-[#e8e8e8] flex items-center justify-center shrink-0 hover:bg-[#d0d0d0] transition-colors"
              style={{ width: t.icon16, height: t.icon16 }}
            >
              <span className="text-[#777] leading-none" style={{ fontSize: t.text10 }}>✕</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* DROPDOWN */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="
              absolute top-[38px] left-0 bg-white rounded-2xl overflow-hidden z-50
              shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-[#e8e8e8]
              w-[480px] max-w-[calc(100vw-2rem)]
            "
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {results.length > 0 ? (
              <>
                {/* VENDOR RESULTS */}
                {vendorResults.length > 0 && (
                  <div>
                    <div className="px-4 pt-4 pb-2">
                      <p className="font-bold uppercase tracking-widest text-[#a1a4aa]" style={{ fontSize: t.text10 }}>Vendors</p>
                    </div>
                    {vendorResults.map(item => {
                      const idx = results.indexOf(item)
                      return (
                        <button
                          key={item.id}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === selected ? 'bg-[#f7f5ef]' : 'hover:bg-[#f7f5ef]'}`}
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelected(idx)}
                        >
                          <div
                            className="rounded-xl bg-[#f7f5ef] border border-[#e8e8e8] flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ width: t.w44, height: t.w44 }}
                          >
                            {item.image
                              ? <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                              : <div className="w-6 h-6 rounded bg-[#e0e0e0]" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1f1f1f]" style={{ fontSize: t.text13 }}>{highlight(item.name, query)}</p>
                            <p className="text-[#777]" style={{ fontSize: t.text11 }}>{item.subtitle}</p>
                          </div>
                          <div className="shrink-0">
                            <span className="bg-[#f7f5ef] text-[#444955] rounded-full px-2 py-0.5 border border-[#e8e8e8]" style={{ fontSize: t.text10 }}>{item.category}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* DIVIDER */}
                {vendorResults.length > 0 && productResults.length > 0 && (
                  <div className="mx-4 border-t border-[#f0f0f0]" />
                )}

                {/* PRODUCT RESULTS */}
                {productResults.length > 0 && (
                  <div>
                    <div className="px-4 pt-4 pb-2">
                      <p className="font-bold uppercase tracking-widest text-[#a1a4aa]" style={{ fontSize: t.text10 }}>Products</p>
                    </div>
                    {productResults.map(item => {
                      const idx = results.indexOf(item)
                      return (
                        <button
                          key={item.id + item.type}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === selected ? 'bg-[#f7f5ef]' : 'hover:bg-[#f7f5ef]'}`}
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelected(idx)}
                        >
                          <div
                            className="rounded-xl bg-[#f7f5ef] border border-[#e8e8e8] flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ width: t.w44, height: t.w44 }}
                          >
                            {item.image
                              ? <img src={item.image} alt="" className="w-full h-full object-contain mix-blend-multiply p-1" />
                              : <div className="w-6 h-6 rounded bg-[#e0e0e0]" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1f1f1f] truncate" style={{ fontSize: t.text13 }}>{highlight(item.name, query)}</p>
                            <p className="text-[#777]" style={{ fontSize: t.text11 }}>{item.subtitle} · {item.size}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {item.price && (
                              <p className="font-bold text-[#1f1f1f]" style={{ fontSize: t.text13 }}>
                                ${item.price.toFixed(2)}<span className="font-normal text-[#777]" style={{ fontSize: t.text10 }}>/unit</span>
                              </p>
                            )}
                            <span className="text-[#a1a4aa]" style={{ fontSize: t.text10 }}>{item.category}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* FOOTER KEYBOARD HINT */}
                <div className="px-4 py-2.5 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center gap-3">
                  {[
                    { key: '↵', label: 'select' },
                    { key: '↑↓', label: 'navigate' },
                    { key: 'esc', label: 'close' },
                  ].map(({ key, label }) => (
                    <span key={key} className="flex items-center gap-1 text-[#a1a4aa]" style={{ fontSize: t.text10 }}>
                      <kbd className="bg-white border border-[#e8e8e8] rounded px-1.5 py-0.5 font-mono shadow-sm" style={{ fontSize: t.text10 }}>{key}</kbd>
                      {label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              /* NO RESULTS */
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f7f5ef] flex items-center justify-center mx-auto mb-3">
                  <img src="/icons/icon_search.svg" alt="" className="w-5 h-5 opacity-40" />
                </div>
                <p className="font-bold text-[#444955]" style={{ fontSize: t.text13 }}>No results for "{query}"</p>
                <p className="text-[#a1a4aa] mt-1" style={{ fontSize: t.text11 }}>Try a product name, vendor, or category</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
