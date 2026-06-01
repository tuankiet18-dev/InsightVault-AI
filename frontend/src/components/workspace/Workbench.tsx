import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, FileText, GitCompare, FileBarChart2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspace } from "@/lib/workspace/mock-store";
import { StatusChip } from "./StatusChip";
import { cn } from "@/lib/utils";

export function Workbench() {
  const { openTabs, activeTabId, setActiveTab, closeTab, documents, updateDocumentStatus } =
    useWorkspace();
  const tabs = openTabs
    .map((id) => documents.find((d) => d.id === id))
    .filter(Boolean) as typeof documents;
  const active = documents.find((d) => d.id === activeTabId) ?? null;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* Tab strip */}
      <div className="flex h-9 items-center gap-px overflow-x-auto border-b border-border bg-card">
        {tabs.length === 0 && (
          <span className="px-3 text-xs text-muted-foreground">No documents open</span>
        )}
        {tabs.map((doc) => {
          const isActive = doc.id === activeTabId;
          return (
            <div
              key={doc.id}
              className={cn(
                "group flex h-full max-w-[220px] cursor-pointer items-center gap-1.5 border-r border-border px-3 text-xs",
                isActive ? "bg-background text-foreground" : "text-muted-foreground hover:bg-accent",
              )}
              onClick={() => setActiveTab(doc.id)}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{doc.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(doc.id);
                }}
                className="rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
                aria-label="Close tab"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Body */}
      {!active ? (
        <EmptyState />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Doc header */}
          <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{active.name}</h2>
            <StatusChip status={active.status} />
            <span className="ml-auto text-[11px] text-muted-foreground">
              Updated {active.updatedAt}
            </span>
            <ActionButtons
              status={active.status}
              onRetry={() => updateDocumentStatus(active.id, "processing")}
            />
          </div>

          {/* Body content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {active.status === "processing" ? (
              <ProcessingState />
            ) : active.status === "failed" ? (
              <FailedState onRetry={() => updateDocumentStatus(active.id, "processing")} />
            ) : (
              <article className="prose prose-slate dark:prose-invert mx-auto max-w-3xl px-8 py-8 prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-6 prose-p:text-[14px] prose-p:leading-7 prose-li:text-[14px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{active.content}</ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ActionButtons({
  status,
  onRetry,
}: {
  status: string;
  onRetry: () => void;
}) {
  const disabled = status === "processing" || status === "failed" || status === "uploaded";
  const reason =
    status === "processing"
      ? "Document đang xử lý, vui lòng đợi"
      : status === "failed"
        ? "Document xử lý thất bại"
        : "Document chưa được xử lý";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-1">
        <ActionBtn icon={GitCompare} label="Compare" disabled={disabled} reason={reason} />
        <ActionBtn icon={FileBarChart2} label="Report" disabled={disabled} reason={reason} />
        {status === "failed" && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  disabled,
  reason,
}: {
  icon: typeof FileText;
  label: string;
  disabled: boolean;
  reason: string;
}) {
  const btn = (
    <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" disabled={disabled}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </Button>
  );
  if (!disabled) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{btn}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="rounded-xl border border-dashed border-border bg-card p-8">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 text-sm font-semibold">No document selected</h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Chọn một tài liệu từ Explorer bên trái để bắt đầu, hoặc upload tài liệu mới.
        </p>
      </div>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-status-processing-foreground" />
      <p className="text-sm font-medium">Đang xử lý tài liệu…</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Hệ thống đang chunk và embed nội dung. Compare/Report sẽ được kích hoạt khi hoàn tất.
      </p>
    </div>
  );
}

function FailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <AlertCircle className="h-6 w-6 text-status-failed-foreground" />
      <p className="text-sm font-medium">Xử lý thất bại</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Có lỗi khi processing tài liệu này. Bạn có thể thử lại.
      </p>
      <Button size="sm" onClick={onRetry}>Retry processing</Button>
    </div>
  );
}
