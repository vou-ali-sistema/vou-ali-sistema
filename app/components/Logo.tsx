interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showSubtitle?: boolean
  className?: string
}

export default function Logo({ size = 'medium', showSubtitle = true, className = '' }: LogoProps) {
  const sizeClasses = {
    small: {
      container: 'py-2 px-3',
      bloco: 'text-sm',
      vouAli: 'text-xl',
      subtitle: 'text-xs',
      info: 'text-xs'
    },
    medium: {
      container: 'py-3 px-5',
      bloco: 'text-base',
      vouAli: 'text-3xl',
      subtitle: 'text-xs',
      info: 'text-xs'
    },
    large: {
      container: 'py-4 px-6',
      bloco: 'text-lg',
      vouAli: 'text-5xl',
      subtitle: 'text-sm',
      info: 'text-xs'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm',
        classes.container,
        className,
      ].join(' ')}
    >
      {/* Faixa/curva Brasil (decorativa) */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-90">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_220deg,#1e3a8a_0deg,#1e3a8a_65deg,#1f9d55_65deg,#1f9d55_145deg,#f6c700_145deg,#f6c700_220deg,#ffffff_220deg,#ffffff_360deg)]" />
        <div className="absolute inset-6 rounded-full bg-white/85" />
      </div>

      <div className="relative">
        <div className="text-left mb-1">
          <h1 className={`font-extrabold text-blue-900 ${classes.bloco}`}>
            BLOCO
          </h1>
        </div>
        <div className="text-center">
          <h2 className={`font-extrabold text-blue-900 mb-1 ${classes.vouAli}`}>
            VOU ALI
          </h2>
          {showSubtitle && (
            <>
              <p className={`text-gray-900 italic mb-0.5 ${classes.subtitle}`} style={{ fontFamily: 'cursive, serif' }}>
                Esse é o último!
              </p>
              <p className={`text-gray-900 italic mb-0.5 ${classes.info}`} style={{ fontFamily: 'cursive, serif' }}>
                Ano XI
              </p>
              <p className={`text-gray-900 font-semibold ${classes.info}`}>
                DESDE 2016
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
