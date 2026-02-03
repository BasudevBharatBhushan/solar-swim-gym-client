import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" className="hover:scale-110 transition-transform">
          <img src="/vite.svg" className="w-24 h-24" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform">
          <img src="/src/assets/react.svg" className="w-24 h-24 animate-[spin_20s_linear_infinite]" alt="React logo" />
        </a>
      </div>
      
      <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Vite + Tailwind CSS
      </h1>
      
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 px-6 rounded-lg transition-all mb-4"
        >
          count is {count}
        </button>
        <p className="text-slate-400">
          Edit <code className="bg-slate-900 px-2 py-1 rounded text-cyan-300">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      
      <p className="mt-8 text-slate-500 italic">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
