import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { FileText, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface MentionListProps {
  items: { id: string; label: string; type?: 'document' | 'folder' }[]
  command: (item: { id: string; label: string; type?: 'document' | 'folder' }) => void
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        selectItem(selectedIndex)
        return true
      }

      return false
    },
  }))

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  return (
    <div className="bg-surface-0 border border-border shadow-md rounded-lg overflow-hidden py-1 min-w-[200px] max-w-[300px] max-h-[300px] overflow-y-auto">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={index}
            className={cn(
              "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-surface-50 transition-colors",
              index === selectedIndex && "bg-primary-50 text-primary-700"
            )}
            onClick={() => selectItem(index)}
          >
            {item.type === 'folder' ? (
              <Folder className="w-4 h-4 shrink-0 opacity-70" />
            ) : (
              <FileText className="w-4 h-4 shrink-0 opacity-70" />
            )}
            <span className="truncate">{item.label}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-surface-500">No items found</div>
      )}
    </div>
  )
})

MentionList.displayName = 'MentionList'
