import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { ActivityRail } from './ActivityRail'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ExplorerPanel } from '../explorer/ExplorerPanel'
import { UploadModal } from '../upload/UploadModal'
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal'
import { CreateFolderModal } from '../workspace/CreateFolderModal'
import { InviteMemberModal } from '../workspace/InviteMemberModal'
import { CommandPalette } from '../search/CommandPalette'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function AppShell({ children, rightPanel }: { children: ReactNode; rightPanel?: ReactNode }) {
  const { explorerOpen, inspectorOpen, mobileDrawer, setMobileDrawer } = useUiStore()
  const [explorerWidth, setExplorerWidth] = useState(280)
  const [inspectorWidth, setInspectorWidth] = useState(340)

  const startResize = useCallback((
    side: 'explorer' | 'inspector',
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = side === 'explorer' ? explorerWidth : inspectorWidth

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startX
      if (side === 'explorer') {
        setExplorerWidth(Math.min(420, Math.max(220, startWidth + delta)))
      } else {
        setInspectorWidth(Math.min(520, Math.max(280, startWidth - delta)))
      }
    }

    const stopResize = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
  }, [explorerWidth, inspectorWidth])

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1">
        <ActivityRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <div className="flex min-h-0 flex-1">
            <div
              className={cn(
                "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out lg:block",
                !explorerOpen && "lg:w-0"
              )}
              style={explorerOpen ? { width: explorerWidth } : undefined}
            >
              <ExplorerPanel />
            </div>
            {explorerOpen && (
              <div
                className="hidden w-1 shrink-0 cursor-col-resize bg-border/40 transition-colors hover:bg-primary/50 lg:block"
                onPointerDown={(event) => startResize('explorer', event)}
                role="separator"
                aria-label="Resize explorer"
              />
            )}

            <main className="flex min-w-0 flex-1 flex-col bg-background">
              {children}
            </main>

            {rightPanel && (
              <>
              {inspectorOpen && (
                <div
                  className="hidden w-1 shrink-0 cursor-col-resize bg-border/40 transition-colors hover:bg-primary/50 xl:block"
                  onPointerDown={(event) => startResize('inspector', event)}
                  role="separator"
                  aria-label="Resize AI inspector"
                />
              )}
              <div
                className={cn(
                  "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out xl:block",
                  !inspectorOpen && "xl:w-0"
                )}
                style={inspectorOpen ? { width: inspectorWidth } : undefined}
              >
                <aside className="flex h-full w-full min-w-0 flex-col border-l border-border bg-card">
                  {rightPanel}
                </aside>
              </div>
              </>
            )}
          </div>

          <StatusBar />
        </div>
      </div>

      <UploadModal />
      <CreateWorkspaceModal />
      <CreateFolderModal />
      <InviteMemberModal />
      <CommandPalette />
      {mobileDrawer && (
        <div className="fixed inset-0 z-50 bg-surface-900/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileDrawer(null)}>
          <aside
            className="h-full w-[min(88vw,340px)] overflow-hidden border-r border-border bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {mobileDrawer === 'explorer' ? <ExplorerPanel /> : rightPanel}
          </aside>
        </div>
      )}
    </div>
  )
}
