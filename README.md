# 🎯 CAPTA PROSPECT — Manual de Instalação

> Sistema de prospecção B2B com mineração de leads via Receita Federal, Google Maps e automação de WhatsApp.

---

## ⚙️ PRÉ-REQUISITOS (Instale antes de tudo)

Antes de começar, instale os seguintes programas no seu computador:

| Programa | Link de Download | Versão Mínima |
|---|---|---|
| **Node.js** | https://nodejs.org/en/download | v18 ou superior |
| **Git** | https://git-scm.com/downloads | Qualquer versão |

> **IMPORTANTE:** Após instalar o Node.js, reinicie o computador.

---

## 📥 PASSO 1 — BAIXAR O PROJETO

Abra o **Prompt de Comando** (CMD) ou **PowerShell** e execute:

```bash
git clone https://github.com/SEU_USUARIO/capta-prospect.git
cd capta-prospect
```

> **⚠️ Substitua `SEU_USUARIO` pelo nome de usuário real do GitHub.**

---

## 📦 PASSO 2 — INSTALAR AS DEPENDÊNCIAS

Dentro da pasta do projeto, execute:

```bash
npm install
```

Aguarde a instalação completa (pode levar alguns minutos na primeira vez).

---

## 🔑 PASSO 3 — CONFIGURAR AS VARIÁVEIS DE AMBIENTE

Crie um arquivo chamado **`.env`** na raiz do projeto com o seguinte conteúdo:

```env
# URL do banco de dados na nuvem (Convex)
CONVEX_DEPLOYMENT=accurate-tiger-693

# Chave da API do Gemini (para qualificação de leads com IA)
GEMINI_API_KEY=SUA_CHAVE_AQUI

# Porta do servidor backend
PORT=3006
```

> **Onde pegar as chaves?**
> - **GEMINI_API_KEY**: Acesse https://aistudio.google.com/app/apikey e crie uma chave gratuita.
> - **CONVEX**: Já está configurado, não precisa alterar.

---

## 🗄️ PASSO 4 — BANCO DE DADOS (RECEITA FEDERAL)

O sistema usa um banco SQLite local com **mais de 11 milhões de empresas** da Receita Federal.

> **⚠️ Este arquivo NÃO está no GitHub por ser muito grande (+2GB).**
> 
> Solicite o arquivo `receita_federal.db` diretamente com o fornecedor do sistema e coloque-o dentro da pasta `data/` do projeto.

Estrutura esperada:
```
capta-prospect/
└── data/
    └── receita_federal.db  ← coloque o arquivo aqui
```

---

## 🚀 PASSO 5 — INICIANDO O SISTEMA (3 TERMINAIS)

O sistema precisa de **3 terminais abertos ao mesmo tempo**. Abra 3 janelas do CMD ou PowerShell na pasta do projeto.

---

### 🖥️ TERMINAL 1 — Banco de Dados em Tempo Real (Convex)

```bash
npx convex dev
```

Na primeira vez, ele vai pedir login. Acesse o link que aparecer no terminal, faça login com sua conta Google e volte ao terminal.

✅ **Quando estiver pronto:** Vai aparecer `Convex functions ready!` no terminal.

---

### ⚙️ TERMINAL 2 — Servidor Backend (Motor de Mineração)

```bash
npm run server
```

✅ **Quando estiver pronto:** Vai aparecer `[CAPTA-NC] Backend Master rodando na porta 3006`.

---

### 🌐 TERMINAL 3 — Interface do Sistema (Frontend)

```bash
npm run dev
```

✅ **Quando estiver pronto:** Vai aparecer um link como `http://localhost:5173`.

**Abra esse link no navegador Google Chrome para usar o sistema.**

---

## 🤖 PASSO 6 — CONFIGURAR O WHATSAPP (Primeira Vez)

Quando for usar o módulo de disparos de WhatsApp:

1. Clique em **"Iniciar Disparos em Massa"** na aba WhatsApp
2. Uma janela do Chrome vai abrir automaticamente com o **WhatsApp Web**
3. **Escaneie o QR Code** com seu celular
4. O login é salvo automaticamente — você só precisa fazer isso **uma vez**

---

## 🔄 INICIANDO NO DIA A DIA

Após a configuração inicial, para usar o sistema todos os dias:

1. Abra **3 terminais** na pasta do projeto
2. Execute em cada um:
   - Terminal 1: `npx convex dev`
   - Terminal 2: `npm run server`
   - Terminal 3: `npm run dev`
3. Acesse `http://localhost:5173` no Chrome

> **💡 Dica:** Crie atalhos na sua Área de Trabalho para cada terminal usando o arquivo `iniciar.bat` incluído no projeto.

---

## ⚡ INÍCIO RÁPIDO (Windows)

Dê um duplo clique no arquivo **`iniciar.bat`** na pasta do projeto. Ele abrirá os 3 terminais automaticamente.

---

## 🛠️ SOLUÇÃO DE PROBLEMAS

| Problema | Solução |
|---|---|
| `npm: command not found` | Reinstale o Node.js e reinicie o PC |
| Porta 3006 em uso | Execute `taskkill /F /IM node.exe` e tente novamente |
| Frontend não carrega | Aguarde o backend estar online (Terminal 2) |
| WhatsApp não conecta | Delete a pasta `wa_session/` e escaneie o QR Code novamente |
| Banco de dados vazio | Verifique se o arquivo `data/receita_federal.db` existe |

---

## 📞 SUPORTE

Em caso de dúvidas, entre em contato com o desenvolvedor do sistema.

---

*Capta Prospect v3.5.0 — Sistema de Prospecção B2B Local-First*
