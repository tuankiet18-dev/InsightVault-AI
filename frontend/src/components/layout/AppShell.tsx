import type { ReactNode } from 'react'
import { ActivityRail } from './ActivityRail'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ExplorerPanel } from '../explorer/ExplorerPanel'
import { UploadModal } from '../upload/UploadModal'
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal'
import { CreateFolderModal } from '../workspace/CreateFolderModal'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function AppShell({ children, rightPanel }: { children: ReactNode; rightPanel?: ReactNode }) {
  const { explorerOpen, inspectorOpen } = useUiStore()

  return (
    <div 
      className={cn(
        "ide-layout bg-surface-50 text-surface-900 h-screen w-screen overflow-hidden",
        !explorerOpen && "explorer-collapsed",
        !inspectorOpen && "inspector-collapsed"
      )}
    >
      <ActivityRail />
      <TopBar />
      
      {explorerOpen && <ExplorerPanel />}
      
      {/* Main Content Area */}
      <main className="ide-main flex flex-col min-w-0 bg-surface-0 border-r border-border">
        {children}
      </main>

      {/* Optional Right Panel (e.g. AI Inspector) */}
      {inspectorOpen && rightPanel && (
        <aside className="ide-inspector w-[340px] shrink-0 border-l border-border bg-surface-50 flex flex-col min-w-0">
          {rightPanel}
        </aside>
      )}

      <StatusBar />
      <UploadModal />
      <CreateWorkspaceModal />
      <CreateFolderModal />
    </div>
  )
}
