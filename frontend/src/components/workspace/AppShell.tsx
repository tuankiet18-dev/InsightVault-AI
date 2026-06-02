import { useEffect, useState } from "react";
import { LeftRail } from "./LeftRail";
import { Topbar } from "./Topbar";
import { StatusBar } from "./StatusBar";
import { ExplorerPanel } from "./ExplorerPanel";
import { Workbench } from "./Workbench";
import { AIInspector } from "./AIInspector";
import { UploadModal } from "./UploadModal";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { CreateFolderModal } from "./CreateFolderModal";
import { InviteMemberModal } from "./InviteMemberModal";
import { WorkspaceProvider } from "@/lib/workspace/mock-store";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [activeRail, setActiveRail] = useState("explorer");
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Auto collapse on narrow screens
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 1280) setInspectorOpen(false);
      if (w < 1024) setExplorerOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
        <div className="flex min-h-0 flex-1">
          <LeftRail activeId={activeRail} onSelect={setActiveRail} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              onOpenUpload={() => setUploadOpen(true)}
              explorerOpen={explorerOpen}
              inspectorOpen={inspectorOpen}
              onToggleExplorer={() => setExplorerOpen((v) => !v)}
              onToggleInspector={() => setInspectorOpen((v) => !v)}
            />
            <div className="flex min-h-0 flex-1">
              <div
                className={cn(
                  "shrink-0 overflow-hidden transition-[width] duration-200",
                  explorerOpen ? "w-[280px]" : "w-0",
                )}
              >
                <ExplorerPanel />
              </div>
              <Workbench />
              <div
                className={cn(
                  "shrink-0 overflow-hidden transition-[width] duration-200",
                  inspectorOpen ? "w-[380px]" : "w-0",
                )}
              >
                <AIInspector />
              </div>
            </div>
            <StatusBar />
          </div>
        </div>
        <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
        <CreateWorkspaceModal />
        <CreateFolderModal />
        <InviteMemberModal />
      </div>
    </WorkspaceProvider>
  );
}
