'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  url: string
  token: string
}

export default function QRCodeDisplay({ url, token }: QRCodeDisplayProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 text-center border-4 border-yellow-400">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">QR Code para Retirada</h2>
      <div className="flex justify-center mb-4">
        <div className="border-4 border-green-600 rounded-xl shadow-lg p-4 bg-white">
          <QRCodeSVG
            value={url}
            size={300}
            level="H"
            includeMargin={true}
          />
        </div>
      </div>
      <p className="text-sm text-gray-700 mt-4">
        <span className="font-semibold">Token:</span>{' '}
        <code className="bg-gradient-to-r from-green-100 to-blue-100 px-3 py-1 rounded-lg border-2 border-green-600 text-blue-900 font-mono text-xs">
          {token}
        </code>
      </p>
    </div>
  )
}

