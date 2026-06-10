import { ChevronRight, FileText, FileType2, FileCode2, FileType, Plus, Upload } from "lucide-react";
import { StatusChip } from "./StatusChip";
import { useWorkspace } from "@/lib/workspace/mock-store";
import type { DocType } from "@/lib/workspace/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const fileIcon: Record<DocType, typeof FileText> = {
  pdf: FileType,
  docx: FileType2,
  txt: FileText,
  md: FileCode2,
};

export function ExplorerPanel() {
  const { workspaces, folders, documents, activeWorkspaceId, openDocument, activeTabId } =
    useWorkspace();
  const ws = workspaces.find((w) => w.id === activeWorkspaceId);
  const { openCreateFolderModal, openUploadModal } = useUiStore();

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 py-2 text-sm">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-1.5 py-1 text-left font-semibold hover:bg-accent">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
            <span className="flex-1 truncate">{ws?.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                openCreateFolderModal();
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-opacity"
              title="New Folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-2 border-l border-border">
              {folders.map((folder) => (
                <FolderNode
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  documents={documents.filter((d) => d.folderId === folder.id)}
                  activeTabId={activeTabId}
                  onOpen={openDocument}
                  onUpload={() => openUploadModal(folder.id)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </aside>
  );
}

function FolderNode({
  name,
  documents,
  activeTabId,
  onOpen,
  onUpload,
}: {
  id: string;
  name: string;
  documents: ReturnType<typeof useWorkspace>["documents"];
  activeTabId: string | null;
  onOpen: (id: string) => void;
  onUpload: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-foreground hover:bg-accent">
        <ChevronRight
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
        />
        <span className="truncate flex-1">{name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onUpload();
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-opacity mr-1"
          title="Upload to folder"
        >
          <Upload className="h-3 w-3" />
        </button>
        <span className="text-[10px] text-muted-foreground w-3 text-right">{documents.length}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ml-4 border-l border-border">
          {documents.map((doc) => {
            const Icon = fileIcon[doc.type];
            const active = activeTabId === doc.id;
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => onOpen(doc.id)}
                  className={cn(
                    "group flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[13px] transition-colors",
                    "hover:bg-accent",
                    active && "bg-primary/10 text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate" title={doc.name}>
                    {doc.name}
                  </span>
                  <StatusChip status={doc.status} className="ml-auto shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
