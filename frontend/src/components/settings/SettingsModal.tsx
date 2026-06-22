import { X, User, Settings, Bell, Shield, Palette, Sun, Moon, Monitor, CreditCard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security'>('profile')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden transform transition-all border border-border">
        
        {/* Sidebar */}
        <div className="w-64 bg-muted/50 border-r border-border p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
            Settings
          </h2>
          <nav className="flex-1 space-y-1">
            <TabButton 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
              icon={<User className="w-4 h-4" />}
            >
              Profile
            </TabButton>
            <TabButton 
              active={activeTab === 'appearance'} 
              onClick={() => setActiveTab('appearance')} 
              icon={<Palette className="w-4 h-4" />}
            >
              Appearance
            </TabButton>
            <TabButton 
              active={activeTab === 'notifications'} 
              onClick={() => setActiveTab('notifications')} 
              icon={<Bell className="w-4 h-4" />}
            >
              Notifications
            </TabButton>
            <TabButton 
              active={activeTab === 'security'} 
              onClick={() => setActiveTab('security')} 
              icon={<Shield className="w-4 h-4" />}
            >
              Security
            </TabButton>
            <div className="pt-4 mt-4 border-t border-border">
              <button
                onClick={() => {
                  onClose()
                  navigate('/billing')
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-card-foreground"
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </button>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-muted-foreground hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-ai-100 flex items-center justify-center border-2 border-border shadow-sm overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-ai-600 font-semibold">{user?.fullName?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground mb-1">{user?.fullName}</h3>
                    <p className="text-sm text-muted-foreground">Manage your profile details and preferences.</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">First Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.fullName?.split(' ')[0] || ''}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-muted/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.fullName?.split(' ').slice(1).join(' ') || ''}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-muted/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-card-foreground">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-muted/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm text-muted-foreground cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">Managed by Google Authentication</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground">Role</label>
                    <div className="w-full px-3 py-2 bg-accent border border-border rounded-lg text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Workspace Owner
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <button className="px-6 py-2 bg-primary hover:bg-primary text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-card-foreground mb-1">Appearance</h3>
                  <p className="text-muted-foreground">Customize the look and feel of your workspace.</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-card-foreground">Theme Preference</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <ThemeOption
                      title="Light"
                      description="Clean and bright"
                      icon={<Sun className="w-5 h-5 text-muted-foreground" />}
                      value="light"
                    />
                    <ThemeOption
                      title="Dark"
                      description="Easy on the eyes"
                      icon={<Moon className="w-5 h-5 text-muted-foreground" />}
                      value="dark"
                    />
                    <ThemeOption
                      title="System"
                      description="Syncs with OS"
                      icon={<Monitor className="w-5 h-5 text-muted-foreground" />}
                      value="system"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {activeTab !== 'profile' && activeTab !== 'appearance' && (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground animate-in fade-in duration-300">
                <Settings className="w-12 h-12 mb-4 opacity-20" />
                <p>This settings page is under construction.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean, onClick: () => void, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-muted text-card-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-card-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function ThemeOption({
  title,
  description,
  icon,
  value
}: {
  title: string,
  description: string,
  icon: React.ReactNode,
  value: 'light' | 'dark' | 'system'
}) {
  const { theme, setTheme } = useThemeStore()
  const active = theme === value

  return (
    <button
      onClick={() => setTheme(value)}
      className={`relative flex flex-col p-4 border rounded-xl text-left transition-all ${
        active
          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary-500'
          : 'border-border bg-muted/50 hover:bg-accent hover:border-border'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
        active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {icon}
      </div>
      <span className="font-semibold text-card-foreground text-sm mb-1">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
      
      {active && (
        <div className="absolute top-4 right-4 w-5 h-5 bg-primary/100 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}
