import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useWorkspaces } from '@/hooks/useWorkspaces'

export function ComparePage() {
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const firstWorkspace = workspaces[0]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!firstWorkspace) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to={`/workspaces/${firstWorkspace.id}?tool=compare`} replace />
}
