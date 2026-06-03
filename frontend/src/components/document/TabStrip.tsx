import { X } from 'lucide-react'
import { useTabStore } from '@/stores/tabStore'
import { cn } from '@/lib/utils'
import type { TabItem } from '@/types/ui'

export function TabStrip() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore()

  if (tabs.length === 0) return null

  return (
    <nav className="flex h-9 w-full items-center border-b border-border bg-card select-none overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
        "group relative flex-1 flex h-9 min-w-[60px] max-w-[220px] items-center border-r border-border px-3 text-xs transition-colors shrink",
        isActive 
          ? "bg-background text-foreground"
          : "text-muted-foreground hover:bg-accent"
      )}
    >
      <span className="truncate mr-4">{tab.label}</span>
      
      {tab.closable !== false && (
        <div 
          onClick={onClose}
          className={cn(
            "absolute right-1.5 rounded p-0.5 transition-colors cursor-default hover:bg-muted",
            isActive ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100"
          )}
          role="button"
          aria-label="Close tab"
        >
          <X className="w-3.5 h-3.5" />
        </div>
      )}
      
    </button>
  )
}
