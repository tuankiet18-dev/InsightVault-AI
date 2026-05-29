import { useState, useRef, useEffect, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger?: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div 
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="cursor-pointer"
      >
        {trigger || (
          <button className="p-1 rounded-md hover:bg-surface-200 text-surface-500 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 mt-1 w-48 rounded-md shadow-lg bg-surface-0 border border-border py-1 focus:outline-none",
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onClick: (e: React.MouseEvent) => void
  destructive?: boolean
  icon?: ReactNode
}

export function DropdownMenuItem({ children, onClick, destructive, icon }: DropdownMenuItemProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      className={cn(
        "flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors hover:bg-surface-100",
        destructive ? "text-danger-600 hover:text-danger-700 hover:bg-danger-50" : "text-surface-700"
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
