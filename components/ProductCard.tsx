'use client'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { t } from '@/lib/tokens'
import { useCart } from '@/lib/cartContext'

type Product = {
  id: string
  name: string
  image: string | null
  wholesaleUnitPrice: number
  isShippingFee?: boolean
}

type Vendor = {
  id: string
  name: string
}

export default function ProductCard({ product, vendor }: { product: Product, vendor: Vendor }) {
  const { items, addItem } = useCart()
  const cartItem = items.find(i => i.vendorId === vendor.id && i.productId === product.id)
  const qty = cartItem?.quantity ?? 0

  if (product.isShippingFee || !product.image) return null

  return (
    <Link href={`/vendors/${vendor.id}/products/${product.id}`} className="no-min-h block">
      <motion.div
        className={`flex flex-col rounded-lg bg-white shadow-sm cursor-pointer w-full md:w-[200px] md:shrink-0 ${qty > 0 ? 'border-2 border-[#beead8]' : 'border border-[#e8e8e8]'}`}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image area */}
        <div className="relative shrink-0 bg-[#f7f5ef] flex items-center justify-center p-2 overflow-hidden rounded-t-lg aspect-square md:aspect-auto md:h-[135px]">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain mix-blend-multiply"
          />

          {/* Persistent add button / quantity stepper */}
          <AnimatePresence mode="wait" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-2 right-2 no-min-h w-9 h-9 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-[#f7f5ef] active:scale-95 transition-transform"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addItem(vendor.id, product.id, 1, 'units')
                }}
                aria-label={`Add ${product.name} to cart`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="#28ba93" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-2 right-2 h-9 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center"
                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    addItem(vendor.id, product.id, -1, 'units')
                  }}
                  className="no-min-h w-9 h-9 flex items-center justify-center hover:bg-[#f7f5ef] active:scale-95 transition-transform rounded-l-full"
                  aria-label={`Remove one ${product.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8" stroke="#28ba93" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="min-w-[20px] text-center text-[13px] font-bold text-[#1f1f1f] px-1">
                  {qty}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    addItem(vendor.id, product.id, 1, 'units')
                  }}
                  className="no-min-h w-9 h-9 flex items-center justify-center hover:bg-[#f7f5ef] active:scale-95 transition-transform rounded-r-full"
                  aria-label={`Add another ${product.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 3v8M3 7h8" stroke="#28ba93" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: t.p8, gap: t.p6 }}>
          <p className="font-bold text-[#377b82]" style={{ fontSize: t.text11 }}>{vendor.name}</p>
          <p className="font-bold leading-tight text-[#444955] text-[10px] line-clamp-2 min-h-[1.5rem]">{product.name}</p>
          <p className="text-[#777]" style={{ fontSize: t.text10 }}>${product.wholesaleUnitPrice.toFixed(2)} / unit</p>
        </div>
      </motion.div>
    </Link>
  )
}
