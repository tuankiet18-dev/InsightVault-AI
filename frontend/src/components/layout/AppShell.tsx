import type { ReactNode } from 'react'
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useMediaQuery } from '@/hooks/use-media-query'

export function AppShell({ children, rightPanel }: { children: ReactNode; rightPanel?: ReactNode }) {
  const { explorerOpen, inspectorOpen, mobileDrawer, setMobileDrawer, focusMode } = useUiStore()
  const supportsExplorerPanel = useMediaQuery('(min-width: 1024px)')
  const supportsInspectorPanel = useMediaQuery('(min-width: 1280px)')
  const showExplorerPanel = supportsExplorerPanel && explorerOpen && !focusMode
  const showInspectorPanel = supportsInspectorPanel && Boolean(rightPanel) && inspectorOpen && !focusMode

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1">
        <ActivityRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1 w-full">
            {showExplorerPanel && (
              <ResizablePanel
                id="explorer-panel"
                defaultSize="20%"
                minSize="220px"
                maxSize="40%"
                groupResizeBehavior="preserve-pixel-size"
                className="min-w-0"
              >
                <div className="h-full w-full overflow-hidden">
                  <ExplorerPanel />
                </div>
              </ResizablePanel>
            )}
            {showExplorerPanel && <ResizableHandle withHandle />}

            <ResizablePanel id="main-panel" defaultSize="60%" minSize="360px" className="min-w-0">
              <main className="flex h-full w-full flex-col bg-background min-h-0 min-w-0 overflow-hidden">
                {children}
              </main>
            </ResizablePanel>

            {showInspectorPanel && <ResizableHandle withHandle />}
            {showInspectorPanel && (
              <ResizablePanel
                id="inspector-panel"
                defaultSize="20%"
                minSize="300px"
                maxSize="40%"
                groupResizeBehavior="preserve-pixel-size"
                className="min-w-0"
              >
                <aside className="flex h-full w-full flex-col border-l border-border bg-card overflow-hidden">
                  {rightPanel}
                </aside>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>

          <StatusBar />
        </div>
      </div>

      <UploadModal />
      <CreateWorkspaceModal />
      <CreateFolderModal />
      <InviteMemberModal />
      <CommandPalette />
      {mobileDrawer && (
        <div className="fixed inset-0 z-50 bg-surface-900/45 backdrop-blur-sm xl:hidden" onClick={() => setMobileDrawer(null)}>
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
