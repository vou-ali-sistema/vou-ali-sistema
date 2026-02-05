import Logo from '@/app/components/Logo'
import PendenteClient from './PendenteClient'

export default async function TrocaPendentePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await (searchParams || Promise.resolve({}))
  
  const getParam = (key: string) => {
    const v = params[key]
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
            Aguarde a confirmação do pagamento. Assim que for aprovado, seu QR code e token aparecerão aqui automaticamente!
          </p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>💡 Importante:</strong> Assim que o pagamento for confirmado, você verá seu QR code e token de troca nesta página. Você também receberá um email com essas informações.
          </p>
        </div>

        <PendenteClient paymentId={paymentId} preferenceId={preferenceId} externalReference={externalReference} />
      </div>
    </div>
  )
}

