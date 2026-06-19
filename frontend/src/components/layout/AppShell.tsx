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

export function AppShell({ children, rightPanel }: { children: ReactNode; rightPanel?: ReactNode }) {
  const { explorerOpen, inspectorOpen, mobileDrawer, setMobileDrawer, focusMode } = useUiStore()

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1">
        <ActivityRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1 w-full">
            {explorerOpen && !focusMode && (
              <ResizablePanel id="explorer-panel" defaultSize={20} minSize={15} maxSize={40} className="min-w-0 hidden lg:block">
                <div className="h-full w-full overflow-hidden">
                  <ExplorerPanel />
                </div>
              </ResizablePanel>
            )}
            {explorerOpen && !focusMode && <ResizableHandle className="hidden lg:flex" withHandle />}

            <ResizablePanel id="main-panel" defaultSize={60} minSize={30} className="min-w-0">
              <main className="flex h-full w-full flex-col bg-background min-h-0 min-w-0 overflow-hidden">
                {children}
              </main>
            </ResizablePanel>

            {rightPanel && inspectorOpen && !focusMode && <ResizableHandle className="hidden xl:flex" withHandle />}
            {rightPanel && inspectorOpen && !focusMode && (
              <ResizablePanel id="inspector-panel" defaultSize={20} minSize={15} maxSize={40} className="min-w-0 hidden xl:block">
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
