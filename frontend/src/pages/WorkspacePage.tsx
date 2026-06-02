import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TabStrip } from '@/components/document/TabStrip'
import { DocumentViewer } from '@/components/document/DocumentViewer'
import { ReportViewer } from '@/components/document/ReportViewer'
import { AiInspector } from '@/components/ai/AiInspector'
import { ComparePanel } from '@/components/compare/ComparePanel'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { FileText, Loader2 } from 'lucide-react'

export function WorkspacePage() {
  const { workspaceId } = useParams()
  const { setActiveWorkspace } = useWorkspaceStore()
  const { tabs, getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const { isLoading, isError } = useWorkspace(workspaceId ?? null)

  useEffect(() => {
    setActiveWorkspace(workspaceId ?? null)
    return () => setActiveWorkspace(null)
  }, [setActiveWorkspace, workspaceId])

  if (!workspaceId) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AppShell rightPanel={<AiInspector />}>
      <TabStrip />
      {tabs.length > 0 && activeTab ? (
        <>
          {activeTab.type === 'document' && <DocumentViewer />}
          {activeTab.type === 'report' && <ReportViewer />}
          {activeTab.type === 'compare' && <ComparePanel />}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-background text-muted-foreground">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-8 w-8 opacity-60" />
          </div>
          <h2 className="mb-1 text-lg font-medium text-foreground">No document open</h2>
          <p className="text-sm">Select a document from the explorer to view it here.</p>
        </div>
      )}
    </AppShell>
  )
}
