'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-[#fde8dc] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01" stroke="#a33500" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="9" stroke="#a33500" strokeWidth="1.5"/>
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-2">Something went wrong</h2>
        <p className="text-[13px] text-[#777] mb-6 max-w-[280px] mx-auto">{error.message}</p>
        <button
          onClick={reset}
          className="bg-[#28ba93] text-white font-bold text-[13px] rounded-full px-6 h-[38px] hover:bg-[#22a882] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
