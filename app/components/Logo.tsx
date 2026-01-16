interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showSubtitle?: boolean
  className?: string
}

export default function Logo({ size = 'medium', showSubtitle = true, className = '' }: LogoProps) {
  // Preferir imagem oficial (substitui o "logo antigo" em todo o sistema)
  // Coloque o arquivo em: public/brand/logo-oficial.jpg
  // IMPORTANTE: sempre que trocar a imagem, incremente a versão abaixo para furar cache do navegador/CDN.
  const logoVersion = '2026-01-16-1'
  const logoImageSrc = `/brand/logo-oficial.jpg?v=${logoVersion}`

  const sizeClasses = {
    small: {
      container: 'py-2 px-3',
      img: 'h-10',
      bloco: 'text-sm',
      vouAli: 'text-xl',
      subtitle: 'text-xs',
      info: 'text-xs'
    },
    medium: {
      container: 'py-3 px-5',
      img: 'h-14',
      bloco: 'text-base',
      vouAli: 'text-3xl',
      subtitle: 'text-xs',
      info: 'text-xs'
    },
    large: {
      container: 'py-4 px-6',
      img: 'h-20',
      bloco: 'text-lg',
      vouAli: 'text-5xl',
      subtitle: 'text-sm',
      info: 'text-xs'
    }
  }

  const classes = sizeClasses[size]

  // Server-safe: sem hooks. Basta colocar a imagem no caminho indicado para trocar em TODO o sistema.
  // Obs: showSubtitle fica sem efeito aqui porque a arte já contém os textos.
  void showSubtitle

  return (
    <div className={['relative overflow-hidden rounded-xl bg-white', classes.container, className].join(' ')}>
      <img
        src={logoImageSrc}
        alt="Bloco Vou Ali"
        className={[classes.img, 'w-full object-contain'].join(' ')}
        loading="eager"
      />
    </div>
  )
}
