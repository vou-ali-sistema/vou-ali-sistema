interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showSubtitle?: boolean
  className?: string
}

export default function Logo({ size = 'medium', showSubtitle = true, className = '' }: LogoProps) {
  // Preferir imagem oficial (substitui o "logo antigo" em todo o sistema)
  // Coloque o arquivo em: public/brand/WhatsApp Image 2026-01-15 at 12.36.51.jpg
  // (Na URL precisa estar encoded por causa de espaços.)
  const logoImageSrc = '/brand/WhatsApp%20Image%202026-01-15%20at%2012.36.51.jpg'

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
