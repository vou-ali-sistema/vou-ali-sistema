# Como Instalar Node.js e npm

## 🔍 Verificar se Node.js está instalado

Abra o terminal (PowerShell ou CMD) e execute:

```bash
node --version
npm --version
```

Se aparecer "não é reconhecido", você precisa instalar o Node.js.

## 📥 Opção 1: Instalar Node.js (Recomendado)

### Passo 1: Baixar Node.js

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (Long Term Support)
3. Escolha o instalador para Windows (.msi)

### Passo 2: Instalar

1. Execute o arquivo baixado (.msi)
2. Siga o assistente de instalação
3. **IMPORTANTE**: Marque a opção "Add to PATH" durante a instalação
4. Conclua a instalação

### Passo 3: Verificar instalação

Feche e abra um NOVO terminal, depois execute:

```bash
node --version
npm --version
```

Se mostrar as versões, está instalado corretamente!

## 🔧 Opção 2: Adicionar Node.js ao PATH (se já estiver instalado)

Se o Node.js já estiver instalado mas não está no PATH:

1. Localize a pasta de instalação (geralmente):
   - `C:\Program Files\nodejs\`
   - Ou: `C:\Program Files (x86)\nodejs\`

2. Adicione ao PATH:
   - Pressione `Win + R`
   - Digite: `sysdm.cpl`
   - Vá em "Avançado" → "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path"
   - Clique em "Editar"
   - Adicione: `C:\Program Files\nodejs\`
   - Clique em "OK" em todas as janelas

3. Feche e abra um NOVO terminal

## ✅ Depois de instalar

1. Feche todos os terminais abertos
2. Abra um NOVO terminal
3. Navegue até a pasta do projeto:
   ```bash
   cd "C:\Users\Nicholas Cordeiro\Desktop\VOU_ALI_SISTEMA"
   ```
4. Execute:
   ```bash
   npm --version
   ```
5. Se funcionar, execute:
   ```bash
   start.bat
   ```

## 🚀 Alternativa: Usar Chocolatey (opcional)

Se você tem Chocolatey instalado:

```bash
choco install nodejs-lts
```

## 📝 Verificação Rápida

Execute no terminal:
```bash
where node
where npm
```

Se mostrar os caminhos, está instalado. Se não mostrar nada, precisa instalar.

