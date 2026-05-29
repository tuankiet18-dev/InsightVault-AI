import { AppShell } from '@/components/layout/AppShell'
import { TabStrip } from '@/components/document/TabStrip'
import { DocumentViewer } from '@/components/document/DocumentViewer'
import { ReportViewer } from '@/components/document/ReportViewer'
import { AiInspector } from '@/components/ai/AiInspector'
import { useTabStore } from '@/stores/tabStore'
import { GitCompare } from 'lucide-react'

export function WorkspacePage() {
  const { tabs, getActiveTab } = useTabStore()
  const activeTab = getActiveTab()

  return (
    <AppShell rightPanel={<AiInspector />}>
      <TabStrip />
      {tabs.length > 0 && activeTab ? (
        <>
          {activeTab.type === 'document' && <DocumentViewer />}
          {activeTab.type === 'report' && <ReportViewer />}
          {activeTab.type === 'compare' && (
            <div className="flex-1 flex flex-col items-center justify-center text-surface-500 bg-surface-50">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-warning-50 text-warning-500 flex items-center justify-center">
                <GitCompare className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-medium text-surface-900 mb-1">Compare View</h2>
              <p className="text-sm">Click "Compare" in the sidebar to open the dedicated comparison tool.</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-surface-500 bg-surface-50">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-surface-200/50 flex items-center justify-center">
            <span className="text-2xl opacity-50">📄</span>
          </div>
          <h2 className="text-lg font-medium text-surface-900 mb-1">No document open</h2>
          <p className="text-sm">Select a document from the explorer to view it here.</p>
        </div>
      )}
    </AppShell>
  )
}
