import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'
import { MentionList } from './MentionList'
import type { MentionListRef } from './MentionList'
import { documentApi } from '@/api/documentApi'
import { folderApi } from '@/api/folderApi'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { SuggestionOptions } from '@tiptap/suggestion'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMentionSuggestion(): Omit<SuggestionOptions<any>, 'editor'> {
  return {
    items: async ({ query }) => {
      const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
      if (!workspaceId) return []
      try {
        const [docs, folders] = await Promise.all([
          documentApi.getDocuments(workspaceId),
          folderApi.getFolders(workspaceId, undefined, true)
        ])
        
        const validDocs = docs.filter(doc => doc.folderId)
        const uniqueDocs = Array.from(new Map(validDocs.map(doc => [doc.originalFileName, doc])).values())
        
        const docItems = uniqueDocs
          .filter(doc => doc.originalFileName.toLowerCase().includes(query.toLowerCase()))
          .map(doc => ({ id: doc.id, label: doc.originalFileName, type: 'document' as const }))
          
        const folderItems = folders
          .filter(folder => folder.name.toLowerCase().includes(query.toLowerCase()))
          .map(folder => ({ id: folder.id, label: folder.name, type: 'folder' as const }))
          
        return [...folderItems, ...docItems].slice(0, 10)
      } catch (error) {
        console.error('Failed to fetch mentions:', error)
        return []
      }
    },
    render: () => {
      let component: ReactRenderer<MentionListRef>
      let popup: TippyInstance[]

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'top-start',
          })
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate(props: any) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }

          return component.ref?.onKeyDown(props) ?? false
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }
}
