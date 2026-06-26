import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { useShareReport } from '@/hooks/useReports'
import type { ReportDto } from '@/types/api'
import { Copy, Loader2, Check, Globe } from 'lucide-react'

interface ShareReportModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  report: ReportDto | null
}

export function ShareReportModal({ isOpen, onClose, workspaceId, report }: ShareReportModalProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [expireAfterDays, setExpireAfterDays] = useState<string>('0')
  const [copied, setCopied] = useState(false)
  const [localPublicToken, setLocalPublicToken] = useState<string | null>(null)
  // Track whether a save just completed so the refetch-triggered useEffect
  // doesn't overwrite the freshly-set local state.
  const justSavedRef = useRef(false)

  const shareMutation = useShareReport(workspaceId)

  // Sync state from the report prop only when the modal opens (or the report
  // changes identity), NOT on every query refetch while the modal is open.
  useEffect(() => {
    if (!isOpen || !report) return
    // Skip the reset if we just saved — the refetch will catch up on its own,
    // and our local state already reflects the correct post-save values.
    if (justSavedRef.current) {
      justSavedRef.current = false
      return
    }
    setIsPublic(report.isPublic)
    setLocalPublicToken(report.publicToken || null)
    if (report.sharedExpiresAt) {
      const days = Math.round(
        (new Date(report.sharedExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpireAfterDays(days > 0 ? days.toString() : '0')
    } else {
      setExpireAfterDays('0')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, isOpen])

  const shareUrl = localPublicToken
    ? `${window.location.origin}/shared/reports/${localPublicToken}`
    : ''

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = () => {
    if (!report) return

    const days = parseInt(expireAfterDays, 10)
    shareMutation.mutate(
      {
        reportId: report.id,
        data: {
          isPublic,
          expireAfterDays: isPublic && days > 0 ? days : null,
        },
      },
      {
        onSuccess: (data) => {
          if (!isPublic) {
            onClose()
          } else {
            // Mark that we just saved so the refetch-triggered useEffect
            // doesn't clobber the state we're about to set.
            justSavedRef.current = true
            if (data.publicToken) {
              setLocalPublicToken(data.publicToken)
            }
          }
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-600" />
            Chia sẻ Báo cáo
          </DialogTitle>
          <DialogDescription>
            Tạo liên kết công khai để chia sẻ báo cáo này với bất kỳ ai, ngay cả những người không có tài khoản.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-foreground">
                Bật liên kết công khai
              </label>
              <p className="text-xs text-muted-foreground">
                Bất kỳ ai có liên kết đều có thể xem.
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {isPublic && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tự động hết hạn (sau N ngày)</label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={expireAfterDays}
                  onChange={(e) => setExpireAfterDays(e.target.value)}
                >
                  <option value="0">Không bao giờ (Vĩnh viễn)</option>
                  <option value="1">Sau 1 ngày</option>
                  <option value="7">Sau 7 ngày</option>
                  <option value="30">Sau 30 ngày</option>
                </select>
              </div>

              {shareUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Liên kết của bạn</label>
                  <div className="flex gap-2">
                    <Input readOnly value={shareUrl} className="bg-muted" />
                    <Button type="button" onClick={handleCopy} variant="secondary" className="shrink-0">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPublic && !shareUrl ? 'Tạo liên kết' : 'Lưu cài đặt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
