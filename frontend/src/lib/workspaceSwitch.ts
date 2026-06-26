import { useAiStore } from '@/stores/aiStore'
import { useChatStore } from '@/stores/chatStore'
import { useTabStore } from '@/stores/tabStore'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function resetWorkspaceSurface() {
  useTabStore.getState().resetTabs()
  useChatStore.getState().setActiveSession(null)
  useChatStore.getState().setInputValue('')
  useChatStore.getState().setPendingTurn(null)
  useAiStore.getState().setScope('workspace')
  useAiStore.getState().setAnswer(null)
  useAiStore.getState().setCitations([])
  useAiStore.getState().setSuggestions([])
  useWorkspaceStore.getState().clearWorkspaceSelection()
  useUiStore.getState().setActiveNavItem('explorer')
}
