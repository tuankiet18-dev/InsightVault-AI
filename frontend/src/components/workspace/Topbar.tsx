import { Search, UserPlus, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore } from "@/stores/uiStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { hasPermission } from "@/utils/permission";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useState } from "react";

export function Topbar({
  explorerOpen,
  inspectorOpen,
  onToggleExplorer,
  onToggleInspector,
}: {
  explorerOpen: boolean;
  inspectorOpen: boolean;
  onToggleExplorer: () => void;
  onToggleInspector: () => void;
}) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { setCreateWorkspaceModalOpen, setInviteModalOpen } = useUiStore();
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { data: workspaces = [] } = useWorkspaces();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const currentUserRole = activeWorkspace?.currentUserRole;

  const canInvite = hasPermission(currentUserRole, 'invite_member');

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleExplorer}
        aria-label="Toggle explorer"
      >
        {explorerOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>

      <div className="flex items-center gap-1">
        <Select value={activeWorkspaceId ?? ''} onValueChange={(val) => setActiveWorkspace(val)}>
          <SelectTrigger className="h-8 w-[200px] text-sm">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setCreateWorkspaceModalOpen(true)}
          title="Create Workspace"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative mx-2 max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents, chunks, reports…"
          className="h-8 pl-8 pr-12 text-sm"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <Button variant="ghost" size="sm" className="h-8 gap-1.5" disabled={!canInvite} onClick={() => setInviteModalOpen(true)}>
        <UserPlus className="h-4 w-4" /> Invite
      </Button>


      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleInspector}
        aria-label="Toggle AI inspector"
      >
        {inspectorOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary hover:ring-2 hover:ring-ring transition-all overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName || 'User'} className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.charAt(0) || "U"
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Theme ({theme})</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
