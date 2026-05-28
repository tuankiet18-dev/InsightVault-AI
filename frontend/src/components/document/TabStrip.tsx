import { X } from 'lucide-react'
import { useTabStore } from '@/stores/tabStore'
import { cn } from '@/lib/utils'
import type { TabItem } from '@/types/ui'

export function TabStrip() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore()

  if (tabs.length === 0) return null

  return (
    <nav className="ide-tabs flex items-end px-2 h-9 bg-surface-100 border-b border-border overflow-x-auto overflow-y-hidden no-scrollbar select-none z-10">
      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <Tab 
            key={tab.id} 
            tab={tab} 
            isActive={activeTabId === tab.id}
            onSelect={() => setActiveTab(tab.id)}
            onClose={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          />
        ))}
      </div>
    </nav>
  )
}

function Tab({ 
  tab, 
  isActive, 
  onSelect, 
  onClose 
}: { 
  tab: TabItem
  isActive: boolean
  onSelect: () => void
  onClose: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex items-center h-8 min-w-[120px] max-w-[200px] px-3 rounded-t-lg text-[13px] transition-colors border border-b-0",
        isActive 
          ? "bg-surface-0 text-primary-600 border-border z-10 shadow-sm" 
          : "bg-surface-100/50 text-surface-500 border-transparent hover:bg-surface-200"
      )}
    >
      <span className="truncate mr-4">{tab.label}</span>
      
      {tab.closable !== false && (
        <div 
          onClick={onClose}
          className={cn(
            "absolute right-1.5 p-1 rounded hover:bg-surface-200 transition-colors cursor-default",
            isActive ? "text-surface-400 hover:text-surface-900" : "text-surface-400 opacity-0 group-hover:opacity-100"
          )}
          role="button"
          aria-label="Close tab"
        >
          <X className="w-3.5 h-3.5" />
        </div>
      )}
      
      {/* Active tab bottom cover to hide border-b of parent */}
      {isActive && (
        <div className="absolute -bottom-px left-0 right-0 h-px bg-surface-0" />
      )}
    </button>
  )
}
