import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function UpgradeModal() {
  const navigate = useNavigate()
  const { upgradeModalState, closeUpgradeModal } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()

  const handleUpgradeClick = () => {
    closeUpgradeModal()
    navigate(activeWorkspaceId ? `/workspaces/${activeWorkspaceId}/billing` : '/billing')
  }

  return (
    <Dialog open={upgradeModalState.isOpen} onOpenChange={closeUpgradeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl">{upgradeModalState.title}</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {upgradeModalState.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button onClick={handleUpgradeClick} className="w-full text-base" size="lg">
            Upgrade Plan
          </Button>
          <Button variant="ghost" onClick={closeUpgradeModal} className="w-full text-muted-foreground">
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
