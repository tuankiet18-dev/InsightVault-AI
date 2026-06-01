import { Link } from 'react-router-dom'
import { ArrowRight, FolderTree, GitCompare, Sparkles } from 'lucide-react'

const features = [
  {
    icon: FolderTree,
    title: 'Explorer',
    description: 'Workspaces, folders, documents với trạng thái AI job rõ ràng.',
  },
  {
    icon: Sparkles,
    title: 'Ask with citations',
    description: 'RAG chat trả lời kèm trích dẫn đoạn nguồn ngay dưới câu trả lời.',
  },
  {
    icon: GitCompare,
    title: 'Compare & Report',
    description: 'So sánh nhiều tài liệu theo objectives, similarities, differences.',
  },
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-20">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[11px] font-bold">IV</span>
          </span>
          INSIGHTVAULT AI · v0.1 MVP
        </div>

        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[35px]">
          A knowledge IDE for your team's documents.
        </h1>

        <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Upload proposals, requirements và research papers vào shared workspace. Hỏi AI
          để tóm tắt, so sánh, phát hiện gap và tạo báo cáo Markdown - kèm trích nguồn.
        </p>

        <div>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open Workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article key={feature.title} className="rounded-lg border border-border bg-card p-4">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="mt-2 text-sm font-semibold text-foreground">{feature.title}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
