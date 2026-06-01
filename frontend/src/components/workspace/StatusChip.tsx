import { cn } from "@/lib/utils";
import type { DocStatus } from "@/lib/workspace/types";
import { CheckCircle2, Loader2, AlertCircle, Circle } from "lucide-react";

const config: Record<
  DocStatus,
  { label: string; cls: string; Icon: typeof CheckCircle2; spin?: boolean }
> = {
  uploaded: {
    label: "Uploaded",
    cls: "bg-status-uploaded text-status-uploaded-foreground",
    Icon: Circle,
  },
  processing: {
    label: "Processing",
    cls: "bg-status-processing text-status-processing-foreground",
    Icon: Loader2,
    spin: true,
  },
  completed: {
    label: "Ready",
    cls: "bg-status-completed text-status-completed-foreground",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    cls: "bg-status-failed text-status-failed-foreground",
    Icon: AlertCircle,
  },
};

export function StatusChip({
  status,
  className,
}: {
  status: DocStatus;
  className?: string;
}) {
  const { label, cls, Icon, spin } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        cls,
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", spin && "animate-spin")} />
      {label}
    </span>
  );
}
