# Guia de Instalação — Capta Prospect (Nova Máquina)

## Pré-requisitos

1. **Node.js 18+** — [nodejs.org](https://nodejs.org) (baixar versão LTS)
2. **Git** — [git-scm.com](https://git-scm.com)
3. Conta no **GitHub** (para clonar o repositório)
4. Conta no **Convex** — [convex.dev](https://convex.dev) (criar gratuitamente com Google/GitHub)

---

## Passo 1 — Clonar o Repositório

```powershell
git clone https://github.com/Jes403/capta-prospect.git
cd capta-prospect
npm install
```

---

## Passo 2 — Criar Projeto no Convex (nova conta)

```powershell
# Fazer login na conta Convex (abre o navegador)
npx convex login

# Criar/selecionar projeto novo (escolha "Create a new project")
npx convex dev --configure=new
```

> O Convex vai pedir o nome do projeto. Use `capta-prospect` ou qualquer nome.  
> Ao final, ele exibirá a URL do novo projeto (ex: `https://nome-do-projeto.convex.cloud`).

---

## Passo 3 — Configurar Autenticação no Convex

No [dashboard do Convex](https://dashboard.convex.dev):

1. Abra seu projeto → **Settings** → **Environment Variables**
2. Adicione a variável:
   - **Nome:** `AUTH_SECRET`
   - **Valor:** Qualquer string longa e aleatória (ex: gere em [randomkeygen.com](https://randomkeygen.com))

---

## Passo 4 — Criar os Arquivos de Ambiente

### Arquivo `.env.local` (frontend)

Crie o arquivo `.env.local` na raiz do projeto com o conteúdo:

```
VITE_CONVEX_URL=https://SEU-PROJETO.convex.cloud
CONVEX_DEPLOYMENT=dev:SEU-PROJETO
VITE_CONVEX_SITE_URL=https://SEU-PROJETO.convex.site
```

> Substitua `SEU-PROJETO` pelo nome do projeto Convex criado no Passo 2.

### Arquivo `.env` (backend)

Crie o arquivo `.env` na raiz do projeto:

```
PORT=3007
GEMINI_API_KEY=SUA_CHAVE_GEMINI
```

> Chave Gemini: obtenha gratuitamente em [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Passo 5 — Transferir o Banco da Receita Federal

O arquivo `receita_federal.db` tem **4.1 GB** e não está no GitHub.  
Copie via **pendrive/HD externo** da máquina original:

- **Origem:** `capta-prospect/data/receita_federal.db`
- **Destino:** `capta-prospect/data/receita_federal.db` (na nova máquina)

Crie a pasta `data/` se não existir:

```powershell
mkdir data
```

---

## Passo 6 — Fazer Deploy das Funções Convex

```powershell
npx convex deploy
```

> Isso envia as funções (`convex/leads.ts`, `convex/auth.ts`, etc.) para o novo projeto na nuvem.

---

## Passo 7 — Importar Leads Existentes (Opcional)

Se quiser migrar os leads do Convex antigo:

1. Na máquina original, execute:
   ```powershell
   node scripts/export-convex-leads.js
   ```
   Isso gera o arquivo `leads_export.json`.

2. Copie `leads_export.json` para a nova máquina.

3. Na nova máquina, execute:
   ```powershell
   node scripts/import-convex-leads.js
   ```

---

## Passo 8 — Compilar o Frontend

```powershell
npm run build
```

> Isso gera a pasta `dist/` que o backend serve automaticamente.

---

## Passo 9 — Rodar o Projeto

Abra **um terminal** e execute:

```powershell
node server/index.js
```

Acesse: [http://localhost:3007](http://localhost:3007)

> O servidor já serve o frontend compilado **e** o backend na mesma porta.  
> O QR Code do WhatsApp aparecerá no terminal ao iniciar.

**Modo desenvolvimento** (frontend com hot-reload):

Abra dois terminais:
- Terminal 1: `node server/index.js`
- Terminal 2: `npm run dev` → acesse [http://localhost:5173](http://localhost:5173)

---

## Resumo — O que precisa ser transferido via pendrive

| Arquivo | Tamanho | Motivo |
|---|---|---|
| `data/receita_federal.db` | ~4.1 GB | Banco da Receita Federal |
| `leads_export.json` | pequeno | Leads existentes (opcional) |

> `.env` e `.env.local` **não estão no GitHub** por segurança — copie ou recrie conforme os passos acima.
