export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">InsightVault AI</h1>
        <p className="text-gray-500 mb-8">AI-powered collaborative knowledge workspace</p>
        <button className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}