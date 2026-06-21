import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'
import { MentionList } from './MentionList'
import type { MentionListRef } from './MentionList'
import { documentApi } from '@/api/documentApi'

export function getMentionSuggestion(workspaceId: string | null) {
  return {
    items: async ({ query }: { query: string }) => {
      if (!workspaceId) return []
      try {
        const docs = await documentApi.getDocuments(workspaceId)
        return docs
          .filter(doc => doc.originalFileName.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10)
          .map(doc => ({ id: doc.id, label: doc.originalFileName }))
      } catch (e) {
        console.error('Failed to fetch documents for mention', e)
        return []
      }
    },
    render: () => {
      let component: ReactRenderer<MentionListRef>
      let popup: TippyInstance[]

      return {
        onStart: (props: Record<string, unknown>) => {
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

        onUpdate(props: Record<string, unknown>) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown(props: Record<string, unknown>) {
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
