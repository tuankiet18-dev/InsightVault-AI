import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import { useUiStore } from '@/stores/uiStore'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  FolderTree, 
  Search, 
  Sparkles,
  FileText,
  ShieldCheck,
  Settings
} from 'lucide-react'

export function ActivityRail() {
  const { activeNavItem, setActiveNavItem } = useUiStore()

  const getIcon = (id: string) => {
    switch (id) {
      case 'explorer': return <FolderTree className="h-5 w-5" />
      case 'search': return <Search className="h-5 w-5" />
      case 'chat': return <Sparkles className="h-5 w-5" />
      case 'reports': return <FileText className="h-5 w-5" />
      case 'admin': return <ShieldCheck className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
    <aside className="hidden h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-rail py-3 text-rail-foreground md:flex">
      <Link to="/dashboard" className="mb-2 block">
        <div 
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold shadow-sm transition-transform hover:scale-105"
          title="InsightVault AI Dashboard"
        >
          IV
        </div>
      </Link>
      
      <nav aria-label="Primary navigation" className="flex w-full flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveNavItem(item.id)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  "hover:bg-white/10 hover:text-white",
                  activeNavItem === item.id && "bg-white/10 text-white"
                )}
                aria-label={item.label}
                aria-current={activeNavItem === item.id ? 'page' : undefined}
              >
                {activeNavItem === item.id && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-rail-active" />
                )}
                {getIcon(item.id)}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </aside>
    </TooltipProvider>
  )
}
