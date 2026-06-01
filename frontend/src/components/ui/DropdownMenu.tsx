import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger?: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger ? (
          <div className="cursor-pointer">{trigger}</div>
        ) : (
          <button className="p-1 rounded-md hover:bg-surface-200 text-surface-500 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align === 'left' ? 'start' : 'end'}
          sideOffset={4}
          className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-0 p-1 shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick: (e: Event) => void
  destructive?: boolean
  icon?: React.ReactNode
}

export function DropdownMenuItem({ children, onClick, destructive, icon }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={(e) => {
        onClick(e)
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-surface-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive ? "text-danger-600 focus:text-danger-700 focus:bg-danger-50" : "text-surface-700"
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </DropdownMenuPrimitive.Item>
  )
}
