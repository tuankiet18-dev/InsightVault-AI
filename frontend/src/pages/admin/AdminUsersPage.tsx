import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import type { UserDto } from '@/types/api'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', search, filterActive],
    queryFn: () => adminApi.getUsers(search || undefined, filterActive),
  })

  const toggleBlock = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminApi.updateUser(userId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  return (
    <main className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <span className="text-sm text-muted-foreground">{users.length} found</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { label: 'All', value: undefined },
            { label: 'Active', value: true },
            { label: 'Blocked', value: false },
          ].map(opt => (
            <Button
              key={String(opt.value)}
              variant={filterActive === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted-foreground">User</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Role</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Last Login</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  onToggle={isActive =>
                    toggleBlock.mutate({ userId: user.id, isActive })
                  }
                  isUpdating={toggleBlock.isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function UserRow({
  user,
  onToggle,
  isUpdating,
}: {
  user: UserDto
  onToggle: (isActive: boolean) => void
  isUpdating: boolean
}) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{user.fullName}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.systemRole === 'admin' ? 'default' : 'outline'}>
          {user.systemRole}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
            user.isActive
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {user.isActive ? (
            <><ShieldCheck className="w-3 h-3" /> Active</>
          ) : (
            <><ShieldAlert className="w-3 h-3" /> Blocked</>
          )}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : '—'}
      </td>
      <td className="px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => onToggle(!user.isActive)}
        >
          {user.isActive ? 'Block' : 'Unblock'}
        </Button>
      </td>
    </tr>
  )
}