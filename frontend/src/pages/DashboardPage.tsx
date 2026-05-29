export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Workspaces', value: 3 },
          { label: 'Documents', value: 12 },
          { label: 'Reports', value: 5 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}