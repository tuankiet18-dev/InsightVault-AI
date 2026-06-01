import { X, Mail, Shield, Clock, CheckCircle2 } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useState } from 'react'
import { useWorkspaceMembers, useAddWorkspaceMember } from '@/hooks/useWorkspaceMembers'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { WorkspaceRole } from '@/types/api'

export function InviteMemberModal() {
  const { inviteModalOpen, setInviteModalOpen } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('viewer')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const { data: members = [], isLoading } = useWorkspaceMembers(inviteModalOpen ? activeWorkspaceId : undefined)
  const addMemberMutation = useAddWorkspaceMember(activeWorkspaceId || '')

  if (!inviteModalOpen || !activeWorkspaceId) return null

  const resetAndClose = () => {
    setInviteModalOpen(false)
    setTimeout(() => {
      setEmail('')
      setRole('viewer')
      setErrorMsg('')
      setSuccessMsg('')
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!email.trim()) return

    addMemberMutation.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setSuccessMsg('Invitation sent successfully!')
          setEmail('')
          setRole('viewer')
          setTimeout(() => setSuccessMsg(''), 3000)
        },
        onError: (error) => {
          setErrorMsg(error.message || 'Failed to send invitation.')
        }
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-card-foreground">Invite Members</h2>
          <button 
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-muted-foreground hover:text-card-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 border-b border-border">
            <div className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label htmlFor="invite-email" className="block text-sm font-medium text-card-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>
                
                <div className="w-32">
                  <label htmlFor="invite-role" className="block text-sm font-medium text-card-foreground mb-1.5">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              {errorMsg && <div className="text-sm text-danger-500 font-medium">{errorMsg}</div>}
              {successMsg && <div className="text-sm text-success-500 font-medium">{successMsg}</div>}

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={addMemberMutation.isPending || !email.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {addMemberMutation.isPending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </form>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Current Members</h3>
            
            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No members found.</div>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{member.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                            <Shield className="w-3 h-3" />
                            {member.role}
                          </span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className={`flex items-center gap-1 text-xs capitalize ${member.status === 'active' ? 'text-success-500' : 'text-warning-500'}`}>
                            {member.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
