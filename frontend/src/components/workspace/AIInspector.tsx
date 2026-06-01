import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Send, Quote, GitCompare, FileBarChart2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/workspace/mock-store";
import { cn } from "@/lib/utils";

export function AIInspector() {
  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="flex h-9 items-center gap-2 border-b border-border px-3">
        <Sparkles className="h-3.5 w-3.5 text-ai" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          AI Inspector
        </span>
      </div>
      <Tabs defaultValue="ask" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="m-2 grid grid-cols-3">
          <TabsTrigger value="ask" className="text-xs">Ask</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs">Compare</TabsTrigger>
          <TabsTrigger value="report" className="text-xs">Report</TabsTrigger>
        </TabsList>
        <TabsContent value="ask" className="m-0 flex min-h-0 flex-1 flex-col">
          <AskTab />
        </TabsContent>
        <TabsContent value="compare" className="m-0 min-h-0 flex-1 overflow-y-auto p-3">
          <CompareTab />
        </TabsContent>
        <TabsContent value="report" className="m-0 min-h-0 flex-1 overflow-y-auto p-3">
          <ReportTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function AskTab() {
  const { chat, sendMessage, openDocument } = useWorkspace();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3">
        {chat.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Quote className="h-3 w-3" /> Sources
                  </div>
                  {m.citations.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openDocument(c.documentId)}
                      className="block w-full rounded border border-border bg-background p-1.5 text-left text-[11px] hover:border-primary"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          [{idx + 1}] {c.documentName}
                        </span>
                        {c.page != null && (
                          <span className="font-mono text-muted-foreground">p.{c.page}</span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground">"{c.snippet}"</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-2">
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Hỏi AI về tài liệu trong workspace…"
            rows={2}
            className="min-h-[60px] resize-none pr-10 text-sm"
          />
          <Button
            size="icon"
            className="absolute bottom-1.5 right-1.5 h-7 w-7"
            onClick={submit}
            disabled={!text.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-1 px-1 text-[10px] text-muted-foreground">
          Câu trả lời sẽ kèm trích nguồn từ tài liệu.
        </p>
      </div>
    </>
  );
}

function CompareTab() {
  const { documents } = useWorkspace();
  const available = documents.filter((d) => d.status === "completed");
  const [selected, setSelected] = useState<string[]>([]);
  const [ran, setRan] = useState(false);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <GitCompare className="h-3 w-3" /> Select documents (≥2)
        </div>
        <div className="space-y-1.5 rounded-md border border-border bg-background p-2">
          {available.map((d) => (
            <label
              key={d.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[13px] hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(d.id)}
                onCheckedChange={() => toggle(d.id)}
              />
              <span className="truncate">{d.name}</span>
            </label>
          ))}
          {available.length === 0 && (
            <p className="text-xs text-muted-foreground">Chưa có document nào ở trạng thái Ready.</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={selected.length < 2}
        onClick={() => setRan(true)}
      >
        Run compare ({selected.length})
      </Button>

      {ran && selected.length >= 2 && (
        <div className="space-y-3 rounded-md border border-border bg-background p-3 text-[13px]">
          <CompareSection title="Objectives">
            <ul className="ml-4 list-disc space-y-0.5">
              <li>Cùng hướng tới việc xây dựng knowledge workspace cho team.</li>
              <li>Tập trung vào RAG và document understanding.</li>
            </ul>
          </CompareSection>
          <CompareSection title="Similarities">
            <p>Đều mô tả pipeline upload → process → embed → retrieve.</p>
          </CompareSection>
          <CompareSection title="Differences">
            <ul className="ml-4 list-disc space-y-0.5">
              <li>Proposal nêu mục tiêu kinh doanh; Requirements chi tiết role và API.</li>
              <li>Một bên dùng MinIO + presigned URL, một bên không đề cập storage.</li>
            </ul>
          </CompareSection>
          <CompareSection title="Recommendations">
            <p>
              Hợp nhất phần authentication và roles từ Requirements vào Proposal trước khi gửi cho
              stakeholder.
            </p>
          </CompareSection>
        </div>
      )}
    </div>
  );
}

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ai">{title}</h4>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function ReportTab() {
  const { documents } = useWorkspace();
  const ready = documents.filter((d) => d.status === "completed");
  const [title, setTitle] = useState("Workspace Insight Report");
  const [docId, setDocId] = useState<string>(ready[0]?.id ?? "");

  const md = `# ${title}

## Source
Generated from **${ready.find((d) => d.id === docId)?.name ?? "—"}**.

## Executive Summary
- Workspace gồm ${documents.length} tài liệu.
- ${ready.length} tài liệu đã sẵn sàng cho RAG.

## Key Findings
1. MVP có 4 nhóm tính năng chính: workspace, document, AI, admin.
2. Authentication dùng Google OAuth + JWT nội bộ.

## Next Steps
- Bổ sung Compare/Report tự động.
- Mở rộng vector search trên pgvector.
`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <FileBarChart2 className="h-3 w-3" /> Generate Markdown Report
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
      <select
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
      >
        {ready.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Preview
        </div>
        <article className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-h1:text-base prose-h2:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </article>
      </div>
      <Button size="sm" className="w-full">
        Export as .md
      </Button>
    </div>
  );
}
