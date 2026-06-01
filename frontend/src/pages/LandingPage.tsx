import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, FolderTree, GitCompare } from "lucide-react";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-20">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[11px] font-bold">IV</span>
          </span>
          INSIGHTVAULT AI · v0.1 MVP
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          A knowledge IDE for your team's documents.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Upload proposals, requirements và research papers vào shared workspace. Hỏi AI để tóm
          tắt, so sánh, phát hiện gap và tạo báo cáo Markdown — kèm trích nguồn.
        </p>
        <div>
          <Link
            to="/workspace"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open Workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Feature icon={FolderTree} title="Explorer">
            Workspaces, folders, documents với trạng thái AI job rõ ràng.
          </Feature>
          <Feature icon={Sparkles} title="Ask with citations">
            RAG chat trả lời kèm trích dẫn đoạn nguồn ngay dưới câu trả lời.
          </Feature>
          <Feature icon={GitCompare} title="Compare & Report">
            So sánh nhiều tài liệu theo objectives, similarities, differences.
          </Feature>
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}
