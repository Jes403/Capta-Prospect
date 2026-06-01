# Capta Prospect — Guia de Instalação

---

## Para o Cliente (instalação simples)

### O que você precisa

- **Node.js** instalado — [nodejs.org](https://nodejs.org) → baixar versão LTS
- O arquivo `receita_federal.db` (enviado via pendrive pelo desenvolvedor)

### Passo a passo

**1. Extraia o arquivo ZIP** em qualquer pasta do computador.

**2. Copie o banco de dados** da Receita Federal:
- Coloque o arquivo `receita_federal.db` dentro da pasta `data\` que está dentro da pasta extraída.
- Se a pasta `data\` não existir, crie ela.

**3. Clique duas vezes em `iniciar_cliente.bat`**
- Na primeira vez, ele instala as dependências automaticamente (pode demorar alguns minutos).
- Depois abre o sistema no navegador em `http://localhost:3007` automaticamente.

**4. WhatsApp:** ao iniciar aparece um QR Code na janela do servidor — escaneie com o celular.

> Se algo não funcionar, acesse `http://localhost:3007/status` para ver o diagnóstico do sistema.

---

## Para o Desenvolvedor (ambiente de desenvolvimento)

### Pré-requisitos

- Node.js 18+ — [nodejs.org](https://nodejs.org)
- Git — [git-scm.com](https://git-scm.com)
- Conta no Convex — [convex.dev](https://convex.dev)

### Passo 1 — Clonar e instalar

```powershell
git clone https://github.com/Jes403/Capta-Prospect.git
cd Capta-Prospect
npm install
```

### Passo 2 — Criar os arquivos de ambiente

**`.env`** (copie o `.env.example` e renomeie):
```
PORT=3007
GEMINI_API_KEY=AIzaSyAfw6Dx_zLagO_lQm9CHRwYS3IHb7Rbt_0
CONVEX_DEPLOYMENT=accurate-tiger-693
```

**`.env.local`** (para o Convex):
```
VITE_CONVEX_URL=https://accurate-tiger-693.convex.cloud
CONVEX_DEPLOYMENT=dev:accurate-tiger-693
VITE_CONVEX_SITE_URL=https://accurate-tiger-693.convex.site
```

### Passo 3 — Banco da Receita Federal

Copie via pendrive para `data/receita_federal.db` (~4.1 GB).

### Passo 4 — Rodar em desenvolvimento

Clique duas vezes em **`iniciar.bat`** — abre automaticamente:
- Terminal do Convex (sincroniza funções com a nuvem)
- Terminal do servidor backend + frontend

Ou manualmente:
```powershell
# Terminal 1
npx convex dev

# Terminal 2
node server/index.js
```

Acesse: `http://localhost:3007`

### Gerar pacote para cliente

```powershell
powershell -ExecutionPolicy Bypass -File gerar_pacote_cliente.ps1
```

Isso compila o frontend, monta a pasta `capta-prospect-cliente\` e cria o `.zip` pronto para enviar.
