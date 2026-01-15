"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onResult: (text: string) => void;
  elementId?: string;
};

export default function QrReaderClient({ onResult, elementId = "qr-reader" }: Props) {
  const qrRef = useRef<any>(null);
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function start() {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod as any;

        if (!isMounted) return;

        // Evita criar/iniciar duas vezes (hot-reload / re-render)
        if (qrRef.current || startedRef.current) return;

        const qr = new Html5Qrcode(elementId);
        qrRef.current = qr;
        startedRef.current = true;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        try {
          // Tenta abrir a câmera traseira (melhor para QR)
          await qr.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              onResult(decodedText);
            },
            () => {
              // erros de leitura são comuns; não precisa spammar
            }
          );
        } catch {
          // Fallback: câmera frontal (ou qualquer disponível)
          await qr.start(
            { facingMode: "user" },
            config,
            (decodedText: string) => {
              onResult(decodedText);
            },
            () => {}
          );
        }
      } catch (e: any) {
        const msg = String(e?.message ?? e ?? "");
        if (msg.includes("NotAllowedError") || msg.toLowerCase().includes("permission")) {
          setError("Permissão da câmera negada. Autorize a câmera no navegador e tente novamente.");
        } else if (msg.includes("NotFoundError") || msg.toLowerCase().includes("no camera")) {
          setError("Nenhuma câmera foi encontrada neste dispositivo.");
        } else if (msg.toLowerCase().includes("secure") || msg.toLowerCase().includes("https")) {
          setError("O leitor de câmera exige HTTPS. Acesse o sistema por https:// para abrir a câmera.");
        } else {
          setError(e?.message ?? "Falha ao iniciar leitor de QR");
        }
      }
    }

    start();

    return () => {
      isMounted = false;
      // limpar scanner quando sair da página
      (async () => {
        try {
          const qr = qrRef.current;
          if (qr) {
            // stop() libera a câmera; clear() limpa o DOM do leitor
            try {
              await qr.stop();
            } catch {
              // ignore
            }
            try {
              await qr.clear();
            } catch {
              // ignore
            }
            qrRef.current = null;
          }
          startedRef.current = false;
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

