@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   PUBLICAR "JA ENTROU?" NO SITE
echo ========================================
echo.
cd /d "%~dp0"

echo [1/3] Adicionando arquivos...
git add app/admin/lista-convidados/page.tsx app/api/admin/lista-convidados/route.ts "app/api/admin/lista-convidados/[id]/route.ts" prisma/schema.prisma 2>nul
git add . 2>nul

echo [2/3] Criando commit...
git commit -m "Lista convidados: coluna e bloco Ja entrou?" 2>nul
if errorlevel 1 (
  echo Nenhuma alteracao para commitar - talvez ja foi enviado.
  echo Tente: git push origin main
  goto push
)

:push
echo [3/3] Enviando para o repositorio (dispara deploy na Vercel)...
git push origin main 2>nul
if errorlevel 1 (
  echo Tentando branch master...
  git push origin master 2>nul
)

echo.
echo Pronto. Se o projeto esta ligado a Vercel, o deploy comeca automatico.
echo Espere alguns minutos e acesse:
echo   https://www.blocovouali.com/admin/lista-convidados
echo Depois use Ctrl+Shift+R para recarregar sem cache.
echo.
pause
