import Logo from '@/app/components/Logo'
import PendenteClient from './PendenteClient'

export default function TrocaPendentePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const getParam = (key: string) => {
    const v = searchParams?.[key]
    if (!v) return undefined
    return Array.isArray(v) ? v[0] : v
  }

  // Mercado Pago costuma retornar: payment_id / preference_id / external_reference / collection_status / status
  const paymentId = getParam('payment_id') || getParam('collection_id')
  const preferenceId = getParam('preference_id')
  const externalReference = getParam('external_reference')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border-4 border-yellow-400">
        <div className="mb-6">
          <div className="inline-block">
            <Logo size="medium" showSubtitle={false} />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Processando Pagamento
          </h3>
          <p className="text-gray-600">
            Aguarde a confirmação do pagamento. Você receberá um email quando o pagamento for aprovado.
          </p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Importante:</strong> Após a confirmação do pagamento, você receberá um token de troca para retirar seus itens.
          </p>
        </div>

        <PendenteClient paymentId={paymentId} preferenceId={preferenceId} externalReference={externalReference} />
      </div>
    </div>
  )
}

