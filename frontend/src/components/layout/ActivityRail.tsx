import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import { useUiStore } from '@/stores/uiStore'
import { 
  FolderTree, 
  Search, 
  MessageSquare, 
  FileText, 
  Settings,
  ShieldAlert
} from 'lucide-react'

export function ActivityRail() {
  const { activeNavItem, setActiveNavItem } = useUiStore()

  const getIcon = (id: string) => {
    switch (id) {
      case 'explorer': return <FolderTree className="w-6 h-6" />
      case 'search': return <Search className="w-6 h-6" />
      case 'chat': return <MessageSquare className="w-6 h-6" />
      case 'reports': return <FileText className="w-6 h-6" />
      case 'admin': return <ShieldAlert className="w-6 h-6" />
      default: return <Settings className="w-6 h-6" />
    }
  }

  return (
    <aside className="ide-rail flex flex-col items-center py-3 bg-surface-100 border-r border-border shrink-0 z-20">
      <div 
        className="w-10 h-10 mb-4 flex items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-lg shadow-sm"
        title="InsightVault AI"
      >
        IV
      </div>
      
      <nav aria-label="Primary navigation" className="flex flex-col gap-2 w-full px-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNavItem(item.id)}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors group",
              activeNavItem === item.id 
                ? "bg-surface-200 text-primary-600" 
                : "text-surface-500 hover:bg-surface-200 hover:text-surface-900"
            )}
            title={item.label}
          >
            {activeNavItem === item.id && (
              <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />
            )}
            {getIcon(item.id)}
          </button>
        ))}
      </nav>
    </aside>
  )
}
