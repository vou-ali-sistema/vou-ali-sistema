import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Pedido não encontrado</h2>
        <p className="text-gray-700 mb-4">
          Esse pedido pode ter sido apagado/limpo, ou você pode estar sem sessão no admin.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pedidos"
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-semibold border border-gray-300"
          >
            Voltar para Pedidos
          </Link>
          <Link
            href="/admin/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    </div>
  )
}

