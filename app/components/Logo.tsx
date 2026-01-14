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
    <div className={`bg-yellow-400 rounded-lg ${classes.container} ${className}`} style={{ backgroundColor: '#facc15' }}>
      <div className="text-left mb-1">
        <h1 className={`font-bold text-blue-900 ${classes.bloco}`} style={{ color: '#1e3a8a' }}>
          BLOCO
        </h1>
      </div>
      <div className="text-center">
        <h2 className={`font-bold text-blue-900 mb-1 ${classes.vouAli}`} style={{ color: '#1e3a8a' }}>
          VOU ALI
        </h2>
        {showSubtitle && (
          <>
            <p className={`text-gray-900 italic mb-0.5 ${classes.subtitle}`} style={{ fontFamily: 'cursive, serif', color: '#111827' }}>
              Esse é o último!
            </p>
            <p className={`text-gray-900 italic mb-0.5 ${classes.info}`} style={{ fontFamily: 'cursive, serif', color: '#111827' }}>
              Ano XI
            </p>
            <p className={`text-gray-900 font-semibold ${classes.info}`} style={{ color: '#111827' }}>
              DESDE 2016
            </p>
          </>
        )}
      </div>
    </div>
  )
}
