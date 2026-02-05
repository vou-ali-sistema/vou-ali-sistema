# Imagens 403 (Vercel Blob Storage)

## O que acontece

As imagens de **promo cards** (e outras enviadas pelo admin) são armazenadas no **Vercel Blob**. As URLs têm o formato:

`https://mn0zqugsgggmkvig.public.blob.vercel-storage.com/uploads/...`

Se o navegador receber **403 (Forbidden)** ao carregar essas URLs, as imagens quebram e o console pode entrar em loop de erros.

## Causas comuns do 403

1. **Token do Blob alterado ou removido**  
   Se o `BLOB_READ_WRITE_TOKEN` foi regenerado no Vercel (Storage → Blob), as URLs antigas podem deixar de funcionar.

2. **Store Blob recriado**  
   Se o store foi apagado ou recriado, as URLs antigas não existem mais.

3. **Restrição de acesso / CORS**  
   Menos comum; em geral o Blob público aceita leitura de qualquer origem.

## O que o sistema faz

- Em todas as **&lt;img&gt;** que usam URL do Blob (galeria, promo cards, apoios, percurso), foi adicionado **onError**: ao falhar o carregamento (ex.: 403), a imagem é trocada por **`/apoios/placeholder.svg`**. Isso evita o loop de erros no console.

## Como corrigir as imagens de verdade

1. **Confirmar o token no Vercel**  
   - Vercel → projeto → **Storage** → **Blob** (ou **Settings** → **Environment Variables**).  
   - Verifique se existe **BLOB_READ_WRITE_TOKEN** e se é o token do store que você está usando.

2. **Novos uploads**  
   - Novos uploads pelo admin usarão o token atual e devem retornar URLs que funcionam.

3. **Imagens antigas (URLs que já dão 403)**  
   - Se o store foi recriado ou o token mudou, essas URLs não voltam a funcionar.  
   - Solução: no admin, **editar cada card** e **enviar a imagem de novo** (re-upload). As novas URLs serão válidas.

## Aviso do Edge

A mensagem **"[Intervention] Images loaded lazily and replaced with placeholders"** é do navegador (Microsoft Edge). Significa que as imagens estão em lazy loading e podem mostrar placeholder até carregar. Não é erro do nosso código.
