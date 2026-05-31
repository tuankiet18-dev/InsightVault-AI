/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ChatMessage, DocumentItem, DocStatus, WorkspaceRole } from "./types";
import { seedDocuments, seedFolders, seedWorkspaces } from "./seed";

interface WorkspaceState {
  workspaces: typeof seedWorkspaces;
  folders: typeof seedFolders;
  documents: DocumentItem[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  openTabs: string[]; // document ids
  activeTabId: string | null;
  openDocument: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  role: WorkspaceRole;
  setRole: (r: WorkspaceRole) => void;
  addDocument: (doc: DocumentItem) => void;
  updateDocumentStatus: (id: string, status: DocStatus) => void;
  chat: ChatMessage[];
  sendMessage: (text: string) => void;
}

const Ctx = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(seedDocuments);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(seedWorkspaces[0].id);
  const [openTabs, setOpenTabs] = useState<string[]>(["d-1"]);
  const [activeTabId, setActiveTabId] = useState<string | null>("d-1");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "m-1",
      role: "assistant",
      content:
        "Xin chào! Tôi có thể tóm tắt, hỏi đáp, so sánh tài liệu trong workspace. Hãy thử hỏi: *MVP gồm những chức năng nào?*",
    },
  ]);

  const openDocument = useCallback((id: string) => {
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]));
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t !== id);
      setActiveTabId((curr) => (curr === id ? next[next.length - 1] ?? null : curr));
      return next;
    });
  }, []);

  const addDocument = useCallback((doc: DocumentItem) => {
    setDocuments((d) => [...d, doc]);
  }, []);

  const updateDocumentStatus = useCallback((id: string, status: DocStatus) => {
    setDocuments((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: "user",
        content: text,
      };
      const aiMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content:
          "Dựa trên các tài liệu trong workspace, MVP của InsightVault AI gồm: shared workspace, upload tài liệu qua presigned URL, xử lý/chunk/embed, RAG chat có trích nguồn, so sánh tài liệu và sinh báo cáo Markdown.",
        citations: [
          {
            id: "c-1",
            documentId: "d-2",
            documentName: "MVP Requirements.docx",
            page: 1,
            snippet: "MVP includes shared workspaces, document upload, RAG-based Q&A...",
          },
          {
            id: "c-2",
            documentId: "d-1",
            documentName: "Project Proposal v3.pdf",
            page: 2,
            snippet: "The MVP includes shared workspaces, document upload, RAG-based Q&A...",
          },
        ],
      };
      setChat((c) => [...c, userMsg, aiMsg]);
    },
    [],
  );

  return (
    <Ctx.Provider
      value={{
        workspaces: seedWorkspaces,
        folders: seedFolders,
        documents,
        activeWorkspaceId,
        setActiveWorkspaceId,
        openTabs,
        activeTabId,
        openDocument,
        closeTab,
        setActiveTab: setActiveTabId,
        role,
        setRole,
        addDocument,
        updateDocumentStatus,
        chat,
        sendMessage,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
