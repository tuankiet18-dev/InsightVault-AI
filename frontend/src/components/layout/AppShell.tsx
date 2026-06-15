import type { ReactNode } from 'react'
import { ActivityRail } from './ActivityRail'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ExplorerPanel } from '../explorer/ExplorerPanel'
import { UploadModal } from '../upload/UploadModal'
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal'
import { CreateFolderModal } from '../workspace/CreateFolderModal'
import { InviteMemberModal } from '../workspace/InviteMemberModal'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function AppShell({ children, rightPanel }: { children: ReactNode; rightPanel?: ReactNode }) {
  const { explorerOpen, inspectorOpen } = useUiStore()

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
                explorerOpen ? "lg:w-[280px]" : "lg:w-0"
              )}
            >
              <ExplorerPanel />
            </div>

            <main className="flex min-w-0 flex-1 flex-col bg-background">
              {children}
            </main>

            {rightPanel && (
              <div
                className={cn(
                  "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out xl:block",
                  inspectorOpen ? "xl:w-[340px]" : "xl:w-0"
                )}
              >
                <aside className="flex h-full w-full min-w-0 flex-col border-l border-border bg-card">
                  {rightPanel}
                </aside>
              </div>
            )}
          </div>

          <StatusBar />
        </div>
      </div>

      <UploadModal />
      <CreateWorkspaceModal />
      <CreateFolderModal />
      <InviteMemberModal />
    </div>
  )
}
