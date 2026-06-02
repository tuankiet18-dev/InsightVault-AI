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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-surface-400">
            Documents
          </p>

          <p className="mt-2 text-3xl font-bold">
            {workspace.documentCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-surface-400">
            Folders
          </p>

          <p className="mt-2 text-3xl font-bold">
            {workspace.folderCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-surface-400">
            AI Reports
          </p>

          <p className="mt-2 text-3xl font-bold">
            {workspace.reportCount ?? 0}
          </p>
        </div>

      </div>
    </div>
  )
}