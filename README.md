# Sistema de Vendas - Bloco Vou Ali

Sistema de vendas desenvolvido com Next.js, TypeScript, Prisma e PostgreSQL.

## Funcionalidades

- **Pedidos**: Criação de pedidos com itens (ABADA com tamanho, PULSEIRA_EXTRA sem tamanho)
- **Integração Mercado Pago**: Criação de links de pagamento e webhook para confirmação
- **Trocas**: Sistema de trocas com tokens únicos e QR Code
- **Cortesias**: Gestão de cortesias
- **Painel Admin**: Dashboard, gestão de pedidos, trocas e cortesias

## Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Mercado Pago SDK
- Tailwind CSS

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente. Copie `.env.example` para `.env` e preencha:
```bash
cp .env.example .env
```

3. Configure o banco de dados PostgreSQL e atualize `DATABASE_URL` no `.env`

4. Execute as migrações do Prisma:
```bash
npm run db:push
```

5. (Opcional) Execute o seed para criar usuário admin:
```bash
npm run db:seed
```
Usuário padrão: `admin@vouali.com` / Senha: `admin123`

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

- `app/` - Páginas e rotas do Next.js
- `app/api/` - API routes
- `app/admin/` - Painel administrativo
- `app/troca/[token]/` - Página pública de troca
- `lib/` - Utilitários e configurações
- `prisma/` - Schema e migrations do Prisma

## APIs

### Pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/[id]` - Detalhes do pedido
- `PATCH /api/pedidos/[id]` - Atualizar pedido

### Trocas
- `POST /api/trocas` - Criar troca
- `GET /api/trocas` - Listar trocas
- `GET /api/trocas?token=...` - Buscar troca por token
- `POST /api/trocas/[id]/entregar` - Entregar item da troca

### Cortesias
- `POST /api/cortesias` - Criar cortesia
- `GET /api/cortesias` - Listar cortesias
- `POST /api/cortesias/[id]/entregar` - Marcar cortesia como entregue

### Webhooks
- `POST /api/webhooks/mercado-pago` - Webhook do Mercado Pago

## Regras de Negócio

- Pedidos só liberam troca quando pagos ou são cortesias
- Retirada é por item (delivered_quantity), pode ser parcial
- Token de troca é único e imprevisível (32 bytes hex)
- ABADA requer tamanho, PULSEIRA_EXTRA não tem tamanho

