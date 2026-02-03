'use client'

export default function Seal11Anos() {
  return (
    <div
      className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 pointer-events-none select-none"
      aria-hidden
    >
      <div className="relative">
        <div
          className="rotate-12 transform origin-center px-4 py-2 rounded-lg border-2 border-amber-400/60 border-pink-400/50 bg-gradient-to-br from-amber-500/25 to-pink-500/25 backdrop-blur-md shadow-[0_4px_20px_rgba(251,191,36,0.25),0_4px_20px_rgba(236,72,153,0.2)]"
          style={{
            boxShadow: '0 4px 20px rgba(251,191,36,0.25), 0 4px 20px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <span className="block text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-amber-200 uppercase tracking-wider">
            11 Anos
          </span>
          <span className="block text-[10px] font-bold text-amber-300/90 uppercase tracking-widest mt-0.5">
            Qualidade
          </span>
        </div>
      </div>
    </div>
  )
}
