'use client'
import { t } from '@/lib/tokens'

type ViewToggleProps = {
  view: 'grid' | 'list'
  onChange: (view: 'grid' | 'list') => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => onChange('list')}
        className="flex items-center gap-1.5 transition-colors"
        aria-label="List view"
      >
        <img
          src="/icons/icon_list_view.svg"
          className={`w-[12px] h-[9px] brightness-0 ${view === 'list' ? 'opacity-100' : 'opacity-30'}`}
          alt="list"
        />
        <span
          className="font-bold"
          style={{ fontSize: t.text11, color: view === 'list' ? '#1f1f1f' : '#aaa' }}
        >
          List
        </span>
      </button>

      <button
        onClick={() => onChange('grid')}
        className="flex items-center gap-1.5 transition-colors"
        aria-label="Grid view"
      >
        <img
          src="/icons/icon_grid_view.svg"
          className={`w-[11px] h-[11px] brightness-0 ${view === 'grid' ? 'opacity-100' : 'opacity-30'}`}
          alt="grid"
        />
        <span
          className="font-bold"
          style={{ fontSize: t.text11, color: view === 'grid' ? '#1f1f1f' : '#aaa' }}
        >
          Grid
        </span>
      </button>
    </div>
  )
}
