import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'
import { AlertTriangle, Search, ShieldAlert, ShieldCheck, Trash2, UserCog } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import type { UserDto } from '@/types/api'

type RoleFilter = 'all' | 'admin' | 'user'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const role = roleFilter === 'all' ? undefined : roleFilter
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', search, filterActive, role],
    queryFn: () => adminApi.getUsers(search || undefined, filterActive, role),
  })

  const detailQuery = useQuery({
    queryKey: ['admin', 'users', selectedUserId],
    queryFn: () => adminApi.getUserDetail(selectedUserId!),
    enabled: !!selectedUserId,
  })

  const updateUser = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { isActive?: boolean; systemRole?: 'user' | 'admin' } }) =>
      adminApi.updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] })
    },
  })

  const deleteUser = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      setSelectedUserId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users</h1>
          <span className="text-sm text-muted-foreground">{users.length} found</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <FilterButtons
            options={[
              ['All', undefined],
              ['Active', true],
              ['Blocked', false],
            ]}
            value={filterActive}
            onChange={setFilterActive}
          />
          <div className="flex gap-2">
            {(['all', 'admin', 'user'] as RoleFilter[]).map(value => (
              <Button
                key={value}
                variant={roleFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(value)}
              >
                {value === 'all' ? 'All roles' : value}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Last Login</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <EmptyRow colSpan={5} label="Loading..." />
              ) : users.length === 0 ? (
                <EmptyRow colSpan={5} label="No users found" />
              ) : (
                users.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    selected={selectedUserId === user.id}
                    onSelect={() => setSelectedUserId(user.id)}
                    onToggleActive={() => updateUser.mutate({ userId: user.id, data: { isActive: !user.isActive } })}
                    onToggleRole={() => updateUser.mutate({
                      userId: user.id,
                      data: { systemRole: user.systemRole === 'admin' ? 'user' : 'admin' },
                    })}
                    isUpdating={updateUser.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {!selectedUserId ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <UserCog className="mb-3 h-8 w-8" />
            Select a user to inspect account details.
          </div>
        ) : detailQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading detail...</div>
        ) : detailQuery.data ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">{detailQuery.data.user.fullName}</h2>
              <p className="text-sm text-muted-foreground">{detailQuery.data.user.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailMetric label="Owned workspaces" value={detailQuery.data.ownedWorkspaceCount} />
              <DetailMetric label="Member workspaces" value={detailQuery.data.memberWorkspaceCount} />
              <DetailMetric label="Uploaded docs" value={detailQuery.data.uploadedDocumentCount} />
              <DetailMetric label="AI credits" value={detailQuery.data.aiCreditsRemaining} />
              <DetailMetric label="Storage" value={formatBytes(detailQuery.data.storageBytes)} />
              <DetailMetric label="Payments" value={detailQuery.data.paymentOrderCount} />
            </div>
            {deleteUser.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                Delete failed. This user may still own workspaces or billing records.
              </div>
            )}
            <Button
              variant="destructive"
              className="w-full"
              disabled={deleteUser.isPending}
              onClick={() => {
                if (window.confirm('Hard delete this user account? This cannot be undone.')) {
                  deleteUser.mutate(selectedUserId)
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete user
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">User detail unavailable.</div>
        )}
      </aside>
    </main>
  )
}

function UserRow({
  user,
  selected,
  onSelect,
  onToggleActive,
  onToggleRole,
  isUpdating,
}: {
  user: UserDto
  selected: boolean
  onSelect: () => void
  onToggleActive: () => void
  onToggleRole: () => void
  isUpdating: boolean
}) {
  return (
    <tr className={selected ? 'bg-muted/50' : 'transition-colors hover:bg-muted/30'}>
      <td className="px-4 py-3">
        <button type="button" onClick={onSelect} className="text-left">
          <div className="font-medium">{user.fullName}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </button>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.systemRole === 'admin' ? 'default' : 'outline'}>{user.systemRole}</Badge>
      </td>
      <td className="px-4 py-3">
        <StatusBadge active={user.isActive} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={isUpdating} onClick={onToggleActive}>
            {user.isActive ? 'Block' : 'Unblock'}
          </Button>
          <Button variant="ghost" size="sm" disabled={isUpdating} onClick={onToggleRole}>
            {user.systemRole === 'admin' ? 'Demote' : 'Make admin'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={active
      ? 'inline-flex items-center gap-1.5 rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
      : 'inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'
    }>
      {active ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
      {active ? 'Active' : 'Blocked'}
    </span>
  )
}

function FilterButtons({
  options,
  value,
  onChange,
}: {
  options: Array<[string, boolean | undefined]>
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map(([label, optionValue]) => (
        <Button
          key={label}
          variant={value === optionValue ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(optionValue)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}

function DetailMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
        {label}
      </td>
    </tr>
  )
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
