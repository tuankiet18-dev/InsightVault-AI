import { FileText, Folder, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
interface WorkspaceDetailProps {
  workspace?: {
    id: string
    name: string
    description?: string
    documentCount?: number
    folderCount?: number
    reportCount?: number
  }
}

export function WorkspaceDetail({
  workspace,
}: WorkspaceDetailProps) {
  if (!workspace) {
    return (
      <div className="p-6 text-surface-400">
        No workspace selected
      </div>
    )
  }

  return (
    <div className="p-6">

      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {workspace.name}
        </h1>

        <p className="mt-2 text-surface-500">
          {workspace.description || 'No description'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">

          <Link to={`/chat?workspaceId=${workspace.id}`} 
          className="rounded-lg bg-primary-600 px-4 py-2 text-white">
          
            Open AI Chat
          </Link>

          <Link to={`/compare?workspaceId=${workspace.id}`} 
          className="rounded-lg border px-4 py-2">
          
            Compare Documents
          </Link>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-xl border bg-surface-0 p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-surface-400">
              Documents
            </p>
          </div>

          <p className="mt-2 text-3xl font-bold">
            {workspace.documentCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-surface-0 p-5">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-surface-400">
              Folders
            </p>
          </div>

          <p className="mt-2 text-3xl font-bold">
            {workspace.folderCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-surface-0 p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <p className="text-sm text-surface-400">
              AI Reports
            </p>
          </div>

          <p className="mt-2 text-3xl font-bold">
            {workspace.reportCount ?? 0}
          </p>
        </div>

      </div>
      <div className="mt-8 rounded-xl border bg-surface-0 p-5">

        <h2 className="mb-4 text-lg font-semibold">
          Recent Activity
        </h2>

        <div className="space-y-3 text-sm">

          <div>
            Documents uploaded:
            {workspace.documentCount ?? 0}
          </div>

          <div>
            AI reports generated:
            {workspace.reportCount ?? 0}
          </div>

        </div>

      </div>
    </div>
  )
}