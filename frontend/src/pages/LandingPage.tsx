import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderTree,
  GitCompare,
  ShieldCheck,
} from 'lucide-react'

const modules = [
  { label: 'Workspace explorer', status: 'Live', icon: FolderTree },
  { label: 'RAG chat with citations', status: 'Live', icon: Bot },
  { label: 'Compare and reports', status: 'Live', icon: GitCompare },
  { label: 'Billing and credits', status: 'Added', icon: CreditCard },
]

const workflow = [
  'Upload PDFs, docs, notes, and research files',
  'Track extraction and AI processing status',
  'Ask questions with source snippets',
  'Compare documents and export Markdown reports',
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 md:min-h-screen md:grid-cols-[0.8fr_1.2fr] md:items-center md:py-10">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              IV
            </span>
            INSIGHTVAULT AI / MVP WORKSPACE
          </div>

          <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Document intelligence for teams that need traceable answers.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            InsightVault AI turns workspace documents into searchable knowledge, comparison reports,
            and cited AI answers while keeping access, processing, and credit limits visible.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/billing"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold transition hover:border-primary"
            >
              View billing
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Workspace roles and protected routes
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documents, reports, chat, compare
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <aside className="rounded-md border border-border bg-background p-4">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Product modules
              </div>
              <div className="space-y-2">
                {modules.map((module) => {
                  const Icon = module.icon
                  return (
                    <div
                      key={module.label}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{module.label}</span>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {module.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </aside>

            <section className="rounded-md border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Workspace command center
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">SWD Product Research</h2>
                </div>
                <span className="rounded-full bg-[var(--status-completed)] px-3 py-1 text-xs font-semibold text-[var(--status-completed-foreground)]">
                  Ready
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Documents" value="128" />
                <Metric label="AI credits" value="4,820" />
                <Metric label="Reports" value="16" />
              </div>

              <div className="mt-5 rounded-md border border-border bg-card p-4">
                <div className="text-sm font-semibold">Active workflow</div>
                <div className="mt-4 space-y-3">
                  {workflow.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-completed-foreground)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  )
}
