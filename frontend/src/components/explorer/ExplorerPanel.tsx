import { FolderTree } from './FolderTree'
import { ProcessingQueue } from './ProcessingQueue'
import { WorkspaceList } from './WorkspaceList'

export function ExplorerPanel() {
  return (
    <aside className="ide-explorer flex flex-col border-r border-border bg-surface-50 w-[280px] shrink-0 min-h-0">
      <div className="flex-1 overflow-y-auto">
        <WorkspaceList />
        <FolderTree />
        <ProcessingQueue />
      </div>
    </aside>
  )
}
