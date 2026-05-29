import { Bell, User } from 'lucide-react'

export default function Topbar() {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        Xin chào, <span className="font-medium text-gray-800">An</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={14} className="text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">An</span>
        </div>
      </div>
    </div>
  )
}