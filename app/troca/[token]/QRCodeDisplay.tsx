'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

interface QRCodeDisplayProps {
  url: string
  token: string
}

export default function QRCodeDisplay({ url, token }: QRCodeDisplayProps) {
  const [qrSize, setQrSize] = useState(280)

  useEffect(() => {
    function recalc() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 360
      // 2 * padding + borda + respiro
      const max = Math.max(200, Math.min(320, w - 80))
      setQrSize(max)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 text-center border-4 border-yellow-400">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">QR Code para Retirada</h2>
      <div className="flex justify-center mb-4">
        <div className="border-4 border-green-600 rounded-xl shadow-lg p-4 bg-white">
          <QRCodeSVG
            value={url}
            size={qrSize}
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

