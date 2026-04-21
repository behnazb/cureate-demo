'use client'
import { POStatus } from '@/lib/purchaseOrdersData'

const statusConfig: Record<POStatus, { bg: string; text: string }> = {
  'Draft':      { bg: 'bg-[#e8e8e8]',  text: 'text-[#555]'    },
  'In Review':  { bg: 'bg-[#fef3c7]',  text: 'text-[#92400e]' },
  'Processing': { bg: 'bg-[#fde8dc]',  text: 'text-[#a33500]' },
  'Confirmed':  { bg: 'bg-[#d4f5e9]',  text: 'text-[#065f46]' },
  'Delivered':  { bg: 'bg-[#dbeafe]',  text: 'text-[#1e40af]' },
  'Invoiced':   { bg: 'bg-[#ede9fe]',  text: 'text-[#5b21b6]' },
  'Paid':       { bg: 'bg-[#d1fae5]',  text: 'text-[#065f46]' },
  'Cancelled':  { bg: 'bg-[#fce8e8]',  text: 'text-[#991b1b]' },
}

export default function POStatusBadge({ status }: { status: POStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${config.bg} ${config.text}`}>
      {status}
    </span>
  )
}
