import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'
import type { AdminWorkspaceDto } from '@/api/adminApi'
import { Database, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

export function AdminWorkspacesPage() {
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<AdminWorkspaceDto | null>(null)
  const queryClient = useQueryClient()

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['admin', 'workspaces', search, includeDeleted],
    queryFn: () => adminApi.getWorkspaces(search || undefined, includeDeleted),
  })

  const deleteMutation = useMutation({
    mutationFn: (workspaceId: string) => adminApi.deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] })
      setWorkspaceToDelete(null)
      toast.success('Workspace đã được xóa thành công.')
    },
    onError: () => {
      toast.error('Không thể xóa workspace. Vui lòng thử lại.')
    },
  })

  const handleDelete = () => {
    if (!workspaceToDelete) return
    deleteMutation.mutate(workspaceToDelete.id)
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Workspaces</h1>
        <span className="text-sm text-muted-foreground">{workspaces.length} workspaces</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by workspace or owner email..."
            className="pl-9"
          />
        </div>
        <Button
          variant={includeDeleted ? 'default' : 'outline'}
          onClick={() => setIncludeDeleted(value => !value)}
        >
          Include deleted
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Workspace</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Usage</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Plan</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Updated</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <EmptyRow colSpan={6} label="Loading..." />
            ) : workspaces.length === 0 ? (
              <EmptyRow colSpan={6} label="No workspaces found" />
            ) : (
              workspaces.map(workspace => {
                const isDeleted = !!workspace.deletedAt
                return (
                  <tr
                    key={workspace.id}
                    className={isDeleted ? 'opacity-50 hover:bg-muted/20' : 'hover:bg-muted/30'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className={isDeleted ? 'line-through text-muted-foreground' : ''}>
                          {workspace.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{workspace.isArchived ? 'Archived' : 'Active'}</span>
                        {isDeleted && (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                            Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{workspace.ownerEmail}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{workspace.memberCount} members / {workspace.documentCount} docs</div>
                      <div className="text-muted-foreground">{formatBytes(workspace.storageBytes)} / {workspace.reportCount} reports</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{workspace.planName ?? 'No plan'}</div>
                      <div className="text-muted-foreground">{workspace.aiCreditsRemaining} credits</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(workspace.updatedAt)}</td>
                    <td className="px-4 py-3">
                      {!isDeleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setWorkspaceToDelete(workspace)}
                          title="Delete workspace"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Xóa Workspace"
        description={`Bạn có chắc chắn muốn xóa workspace "${workspaceToDelete?.name}" không? Hành động này sẽ soft-delete workspace và không thể hoàn tác dễ dàng.`}
        confirmText="Xóa Workspace"
      />
    </main>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">{label}</td>
    </tr>
  )
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
