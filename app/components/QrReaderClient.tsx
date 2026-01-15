"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onResult: (text: string) => void;
  elementId?: string;
};

export default function QrReaderClient({ onResult, elementId = "qr-reader" }: Props) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function start() {
      try {
        const mod = await import("html5-qrcode");
        const { Html5QrcodeScanner } = mod as any;

        if (!isMounted) return;

        // Evita criar duas vezes em hot-reload / navegação
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(elementId, { fps: 10, qrbox: 250 }, false);
        scannerRef.current = scanner;

        scanner.render(
          (decodedText: string) => {
            onResult(decodedText);
          },
          (_scanError: any) => {
            // erros de leitura são comuns; não precisa spammar
          }
        );
      } catch (e: any) {
        setError(e?.message ?? "Falha ao iniciar leitor de QR");
      }
    }

    start();

    return () => {
      isMounted = false;
      // limpar scanner quando sair da página
      (async () => {
        try {
          if (scannerRef.current) {
            await scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch {
          // ignore
        }
      })();
    };
  }, [onResult, elementId]);

  return (
    <div>
      {error ? <p style={{ color: "red" }}>Erro no QR: {error}</p> : null}

      {/* Container obrigatório para o html5-qrcode */}
      <div id={elementId} />
    </div>
  );
}

