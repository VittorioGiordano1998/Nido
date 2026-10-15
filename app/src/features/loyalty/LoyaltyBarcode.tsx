import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import QRCode from 'react-qr-code'

import type { BarcodeType } from './useLoyalty'

const FORMATS: Record<Exclude<BarcodeType, 'qr'>, string> = {
  code128: 'CODE128',
  ean13: 'EAN13',
  code39: 'CODE39',
}

/**
 * Local barcode/QR renderer for the card view. Black on white on purpose: an
 * inverted code is not readable by every scanner.
 */
export function LoyaltyBarcode({ code, type }: { code: string; type: BarcodeType }) {
  const ref = useRef<SVGSVGElement>(null)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (type === 'qr' || !ref.current) return
    try {
      JsBarcode(ref.current, code, {
        format: FORMATS[type],
        width: 2,
        height: 72,
        displayValue: true,
        margin: 10,
        background: '#ffffff',
        lineColor: '#1c1917',
        fontSize: 16,
      })
      setInvalid(false)
    } catch {
      setInvalid(true)
    }
  }, [code, type])

  if (type === 'qr') {
    return <QRCode value={code} size={168} fgColor="#1c1917" bgColor="#ffffff" />
  }

  return (
    <div className="space-y-1">
      <svg ref={ref} className="max-w-full" aria-label={`Codice ${code}`} />
      {invalid && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          Codice non valido per questo formato.
        </p>
      )}
    </div>
  )
}
