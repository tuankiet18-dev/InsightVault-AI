import { Link } from "react-router-dom";
import { FolderTree, Search, Sparkles, FileText, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const items = [
  { id: "explorer", label: "Explorer", icon: FolderTree, to: "/workspace" },
  { id: "search", label: "Search", icon: Search, to: "/workspace" },
  { id: "ai", label: "AI / Chat", icon: Sparkles, to: "/workspace" },
  { id: "reports", label: "Reports", icon: FileText, to: "/workspace" },
  { id: "admin", label: "Admin Monitor", icon: ShieldCheck, to: "/workspace" },
];

export function LeftRail({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <nav className="flex h-full w-14 flex-col items-center gap-1 border-r border-border bg-rail py-3 text-rail-foreground">
        <Link
          to="/"
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
          aria-label="InsightVault home"
        >
          <span className="font-mono text-sm font-bold">IV</span>
        </Link>
        {items.map((item) => {
          const active = activeId === item.id;
          const Icon = item.icon;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                    "hover:bg-white/10 hover:text-white",
                    active && "bg-white/10 text-white",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-rail-active" />
                  )}
                  <Icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
