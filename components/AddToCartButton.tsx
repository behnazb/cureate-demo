'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/lib/cartContext'

type AddToCartButtonProps = {
  vendorId: string
  productId: string
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function AddToCartButton({ vendorId, productId }: AddToCartButtonProps) {
  const { items, addItem, removeItem } = useCart()

  const cartItem = items.find(i => i.vendorId === vendorId && i.productId === productId)
  const qty = cartItem ? cartItem.quantity : 0
  const state = qty === 0 ? 'add' : qty === 1 ? 'quant' : 'subtract'

  const increment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(vendorId, productId, 1, 'units')
  }

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (qty <= 1) {
      removeItem(vendorId, productId)
    } else {
      addItem(vendorId, productId, -1, 'units')
    }
  }

  const remove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeItem(vendorId, productId)
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'add' ? (
        <motion.button
          key="add"
          onClick={increment}
          className="w-[31px] h-[31px] rounded-full bg-[#beead8] flex items-center justify-center text-[#035257]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1, backgroundColor: '#28ba93' }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          aria-label="Add to cart"
        >
          <PlusIcon className="w-[13px] h-[13px]" />
        </motion.button>
      ) : (
        <motion.div
          key="counter"
          className="flex items-center gap-[10px] h-[31px] px-[10px] py-[2px] rounded-full bg-[#beead8]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {/* Left button — trash when qty=1, minus when qty>1 */}
          <motion.button
            onClick={state === 'quant' ? remove : decrement}
            className="w-[13px] h-[13px] flex items-center justify-center shrink-0 text-[#035257]"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            aria-label={state === 'quant' ? 'Remove from cart' : 'Decrease quantity'}
          >
            {state === 'quant' ? (
              <img
                src="/icons/icon_trash.svg"
                alt="remove"
                className="w-full h-full"
                style={{ filter: 'invert(18%) sepia(82%) saturate(456%) hue-rotate(155deg) brightness(85%) contrast(95%)' }}
              />
            ) : (
              <MinusIcon className="w-full h-full" />
            )}
          </motion.button>

          {/* Quantity count */}
          <AnimatePresence mode="wait">
            <motion.span
              key={qty}
              className="text-[#035257] text-[13px] font-bold leading-none min-w-[12px] text-center"
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {qty}
            </motion.span>
          </AnimatePresence>

          {/* Right button — always + */}
          <motion.button
            onClick={increment}
            className="w-[13px] h-[13px] flex items-center justify-center shrink-0 text-[#035257]"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            aria-label="Increase quantity"
          >
            <PlusIcon className="w-full h-full" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
