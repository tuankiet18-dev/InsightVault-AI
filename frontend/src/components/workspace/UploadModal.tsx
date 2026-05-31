import { useCallback, useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace/mock-store";
import type { DocType } from "@/lib/workspace/types";

const ACCEPT = [".pdf", ".docx", ".txt", ".md"];
const MAX_SIZE = 25 * 1024 * 1024;

type Phase = "preparing" | "uploading" | "confirming" | "done" | "error";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  phase: Phase;
  error?: string;
}

function detectType(name: string): DocType | null {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  if (ext === "md" || ext === "markdown") return "md";
  return null;
}

function phaseLabel(p: Phase) {
  switch (p) {
    case "preparing":
      return "Đang chuẩn bị";
    case "uploading":
      return "Đang upload";
    case "confirming":
      return "Đang xác nhận";
    case "done":
      return "Hoàn tất";
    case "error":
      return "Lỗi";
  }
}

export function UploadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addDocument, updateDocumentStatus, folders } = useWorkspace();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const newItems: UploadItem[] = arr.map((file) => {
        const type = detectType(file.name);
        let error: string | undefined;
        if (!type) error = "Định dạng không hỗ trợ (chỉ PDF, DOCX, TXT, MD)";
        else if (file.size > MAX_SIZE) error = "File vượt quá 25MB";
        return {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          phase: error ? "error" : "preparing",
          error,
        };
      });
      setItems((s) => [...s, ...newItems]);

      // simulate upload for valid items
      newItems.forEach((item) => {
        if (item.error) return;
        const type = detectType(item.file.name)!;
        const docId = `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // preparing -> uploading
        setTimeout(() => {
          setItems((s) =>
            s.map((x) => (x.id === item.id ? { ...x, phase: "uploading", progress: 5 } : x)),
          );
          // progress ticks
          const tick = setInterval(() => {
            setItems((s) =>
              s.map((x) => {
                if (x.id !== item.id) return x;
                const next = Math.min(95, x.progress + 10 + Math.random() * 10);
                return { ...x, progress: next };
              }),
            );
          }, 250);
          // finish upload after ~2s
          setTimeout(() => {
            clearInterval(tick);
            setItems((s) =>
              s.map((x) =>
                x.id === item.id ? { ...x, phase: "confirming", progress: 98 } : x,
              ),
            );
            setTimeout(() => {
              setItems((s) =>
                s.map((x) =>
                  x.id === item.id ? { ...x, phase: "done", progress: 100 } : x,
                ),
              );
              addDocument({
                id: docId,
                name: item.file.name,
                type,
                status: "processing",
                folderId: folders[0].id,
                content: `# ${item.file.name}\n\nĐang xử lý…`,
                updatedAt: new Date().toISOString().slice(0, 10),
              });
              // simulate processing complete after 5s
              setTimeout(() => updateDocumentStatus(docId, "completed"), 5000);
            }, 600);
          }, 2000);
        }, 500);
      });
    },
    [addDocument, updateDocumentStatus, folders],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload tài liệu</DialogTitle>
          <DialogDescription>
            Hỗ trợ PDF, DOCX, TXT, Markdown. Tối đa 25MB / file. Upload qua presigned URL.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/40",
          )}
        >
          <UploadCloud className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">Kéo thả file vào đây hoặc click để chọn</p>
          <p className="text-xs text-muted-foreground">PDF · DOCX · TXT · MD · max 25MB</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT.join(",")}
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-md border border-border bg-card p-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{it.file.name}</span>
                  {it.phase === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-status-completed-foreground" />
                  )}
                  {it.phase === "error" && (
                    <AlertCircle className="h-4 w-4 text-status-failed-foreground" />
                  )}
                  <button
                    type="button"
                    onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))}
                    className="rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {it.error ? (
                  <p className="mt-1 text-status-failed-foreground">{it.error}</p>
                ) : (
                  <>
                    <Progress value={it.progress} className="mt-2 h-1.5" />
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>{phaseLabel(it.phase)}</span>
                      <span>{Math.round(it.progress)}%</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
