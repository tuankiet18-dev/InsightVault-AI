import { useWorkspace } from "@/lib/workspace/mock-store";
import { ShieldCheck, Database, Activity } from "lucide-react";

export function StatusBar() {
  const { role, documents } = useWorkspace();
  const processing = documents.filter((d) => d.status === "processing").length;
  const failed = documents.filter((d) => d.status === "failed").length;
  return (
    <footer className="flex h-7 items-center gap-4 border-t border-border bg-card px-3 font-mono text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3" /> role: <span className="text-foreground">{role}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Database className="h-3 w-3" /> scope: <span className="text-foreground">workspace</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Activity className="h-3 w-3" /> jobs:{" "}
        <span className="text-foreground">{processing} running</span>
        {failed > 0 && <span className="text-status-failed-foreground">· {failed} failed</span>}
      </span>
      <span className="ml-auto">InsightVault AI · v0.1 MVP</span>
    </footer>
  );
}
