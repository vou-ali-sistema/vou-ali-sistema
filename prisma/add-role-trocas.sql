-- Adiciona o valor TROCAS ao enum Role no PostgreSQL.
-- Use este arquivo SE o seed der erro: invalid input value for enum "Role": "TROCAS"
-- Rode uma vez (pgAdmin/DBeaver ou: psql -U postgres -d vouali_vendas -f prisma/add-role-trocas.sql)
-- Depois rode de novo: npm run db:seed

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TROCAS';
