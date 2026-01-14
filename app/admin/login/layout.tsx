// Layout específico para a página de login - não verifica autenticação
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
