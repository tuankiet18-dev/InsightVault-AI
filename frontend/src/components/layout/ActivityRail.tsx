import { Link } from 'react-router-dom'
import {
  CreditCard,
  FileBarChart2,
  FolderTree,
  GitCompare,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { useTabStore } from '@/stores/tabStore'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn } from '@/lib/utils'

type RailAction = {
  id: string
  label: string
  icon: LucideIcon
  onSelect: () => void
}

export function ActivityRail() {
  const {
    activeNavItem,
    explorerOpen,
    inspectorOpen,
    setActiveNavItem,
    setCommandPaletteOpen,
    toggleExplorer,
    toggleInspector,
  } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const { openTab } = useTabStore()
  const { user } = useAuthStore()

  const actions: RailAction[] = [
    {
      id: 'explorer',
      label: 'Explorer',
      icon: FolderTree,
      onSelect: () => {
        setActiveNavItem('explorer')
        if (!explorerOpen) toggleExplorer()
      },
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onSelect: () => {
        setActiveNavItem('search')
        setCommandPaletteOpen(true)
      },
    },
    {
      id: 'chat',
      label: 'Workspace chat',
      icon: Sparkles,
      onSelect: () => {
        setActiveNavItem('chat')
        if (!inspectorOpen) toggleInspector()
      },
    },
    {
      id: 'compare',
      label: 'Compare documents',
      icon: GitCompare,
      onSelect: () => {
        setActiveNavItem('compare')
        openTab({
          id: 'compare-workspace',
          label: 'Compare',
          type: 'compare',
          closable: true,
        })
      },
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileBarChart2,
      onSelect: () => {
        setActiveNavItem('reports')
        openTab({
          id: 'reports-workspace',
          label: 'Reports',
          type: 'reports',
          closable: true,
        })
      },
    },
  ]

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="hidden h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-rail py-3 text-rail-foreground md:flex">
        <RailLink label="Dashboard" to="/dashboard">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-105">
            IV
          </div>
        </RailLink>

        <nav aria-label="Workspace actions" className="flex w-full flex-1 flex-col items-center gap-1">
          {actions.map((item) => (
            <RailButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeNavItem === item.id}
              onClick={item.onSelect}
            />
          ))}
        </nav>

        <div className="flex w-full flex-col items-center gap-1 border-t border-white/10 pt-2">
          <RailLink
            label="Billing"
            to={activeWorkspaceId ? `/billing?workspaceId=${activeWorkspaceId}` : '/billing'}
          >
            <CreditCard className="h-5 w-5 pointer-events-none" />
          </RailLink>
          {user?.systemRole === 'admin' && (
            <RailLink label="Admin" to="/admin">
              <ShieldCheck className="h-5 w-5" />
            </RailLink>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

function RailButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-md transition-colors',
            'hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            active && 'bg-white/10 text-white'
          )}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
        >
          {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-rail-active" />}
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function RailLink({
  label,
  to,
  children,
}: {
  label: string
  to: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label={label}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
