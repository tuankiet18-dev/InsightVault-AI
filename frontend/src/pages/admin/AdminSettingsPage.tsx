import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, CreditCard, Globe2, Save, ShieldCheck } from 'lucide-react'
import { adminApi } from '@/api/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
  })
  const updateSettings = useMutation({
    mutationFn: (form: HTMLFormElement) => {
      const formData = new FormData(form)
      return adminApi.updateSettings({
        defaultAiModel: String(formData.get('defaultAiModel') ?? ''),
        defaultWorkspaceCredits: Number(formData.get('defaultWorkspaceCredits') ?? 0),
        webSearchEnabled: formData.get('webSearchEnabled') === 'on',
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  })

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">System Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Central admin-controlled settings stored in the database.
          </p>
        </div>
        <span className={data?.persisted
          ? 'inline-flex w-fit items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700'
          : 'inline-flex w-fit items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700'
        }>
          <ShieldCheck className="h-3.5 w-3.5" />
          {data?.persisted ? 'Database persisted' : 'Runtime only'}
        </span>
      </div>

      {isLoading || !data ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading settings...
        </div>
      ) : (
        <form
          key={`${data.defaultAiModel}-${data.defaultWorkspaceCredits}-${data.webSearchEnabled}`}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          onSubmit={(event) => {
            event.preventDefault()
            updateSettings.mutate(event.currentTarget)
          }}
        >
          <section className="space-y-4">
            <SettingCard
              icon={<Bot className="h-5 w-5 text-ai-500" />}
              title="AI defaults"
              description="Controls defaults exposed to configurable AI workflows."
            >
              <label className="block text-sm font-medium">
                Default model
                <Input name="defaultAiModel" defaultValue={data.defaultAiModel} className="mt-2" />
              </label>
              <label className="mt-4 flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
                <input
                  name="webSearchEnabled"
                  type="checkbox"
                  defaultChecked={data.webSearchEnabled}
                  className="mt-1"
                />
                  <span>
                  <span className="block font-medium">Enable web search augmentation</span>
                  <span className="text-xs text-muted-foreground">
                    Stored and sent to AI service requests; search provider execution is still pending.
                  </span>
                </span>
              </label>
            </SettingCard>

            <SettingCard
              icon={<CreditCard className="h-5 w-5 text-primary" />}
              title="Quota defaults"
              description="Default credit value for configurable provisioning flows."
            >
              <label className="block text-sm font-medium">
                Default workspace credits
                <Input
                  name="defaultWorkspaceCredits"
                  defaultValue={data.defaultWorkspaceCredits}
                  type="number"
                  min={0}
                  className="mt-2"
                />
              </label>
            </SettingCard>
          </section>

          <aside className="space-y-4">
            <SettingCard
              icon={<Globe2 className="h-5 w-5 text-muted-foreground" />}
              title="Service status"
              description="Read-only deployment configuration."
            >
              <ReadOnlyRow label="AI service" value={data.aiServiceBaseUrl} />
              <ReadOnlyRow label="SMTP" value={data.smtpEnabled ? 'Enabled' : 'Disabled'} />
              <ReadOnlyRow label="PayOS" value={data.payOsEnabled ? 'Enabled' : 'Disabled'} />
            </SettingCard>

            <div className="rounded-xl border border-border bg-card p-4">
              <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                <Save className="h-4 w-4" />
                Save settings
              </Button>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Model and default credits are applied by runtime flows. Web search is a feature flag until a search provider is wired in AI service.
              </p>
            </div>
          </aside>
        </form>
      )}
    </main>
  )
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg border border-border bg-muted/50 p-2">{icon}</div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[180px] break-words text-right font-medium">{value}</span>
    </div>
  )
}
