# 🎯 CAPTA PROSPECT
### Sistema de Prospecção B2B — Local-First

> Mineração de leads via Receita Federal, Google Maps e automação de WhatsApp com IA.

---

## 📚 Documentação Completa

Toda a documentação está organizada passo a passo. **Siga na ordem:**

| # | Documento | Descrição |
|---|---|---|
| 1 | [📥 Instalação (Node.js e Git)](./docs/01-instalacao.md) | Instale os programas necessários |
| 2 | [⚙️ Configuração (Primeiro Uso)](./docs/02-configuracao.md) | Clone o projeto e configure |
| 3 | [🚀 Como Usar (Dia a Dia)](./docs/03-como-usar.md) | Inicie os 3 terminais e use o sistema |
| 4 | [🛠️ Solução de Problemas](./docs/04-problemas.md) | Erros comuns e como resolver |

---

## ⚡ Início Rápido (Se já configurou antes)

1. Dê **duplo clique** no arquivo **`iniciar.bat`**
2. Aguarde os **3 terminais** ficarem prontos
3. Acesse **http://localhost:5173** no Chrome

---

## 🏗️ Arquitetura do Sistema

O sistema roda **3 serviços simultaneamente** no seu computador:

```
┌─────────────────────────────────────────────────────────┐
│                    CAPTA PROSPECT                        │
├──────────────────┬──────────────────┬───────────────────┤
│  TERMINAL 1      │   TERMINAL 2     │   TERMINAL 3      │
│  🟦 Convex Dev   │   🟨 Backend     │   🟩 Frontend     │
│  npx convex dev  │   npm run server │   npm run dev     │
│  Banco de Dados  │   Motor Porta    │   Interface Web   │
│  em Tempo Real   │   3006           │   localhost:5173  │
└──────────────────┴──────────────────┴───────────────────┘
```

---

## 🔧 Funcionalidades

- **🔍 Mineração Receita Federal** — Base local com 11M+ empresas filtradas pelo Crivo LDR
- **🗺️ Mineração Google Maps** — Busca automática com avaliações e notas
- **🤖 Crivo LDR** — Validação automática: site ativo, reputação GMN, e-mail corporativo
- **📋 CRM Kanban** — Pipeline de vendas com drag & drop
- **📱 Automação WhatsApp** — Disparos personalizados com acompanhamento em tempo real
- **🧠 IA Gemini** — Qualificação inteligente de leads

---

## 📋 Pré-Requisitos

| Programa | Download | Versão Mínima |
|---|---|---|
| Node.js | https://nodejs.org/en/download | v18+ |
| Git | https://git-scm.com/downloads | Qualquer |
| Google Chrome | https://www.google.com/chrome | Qualquer |

---

## 📁 Estrutura do Projeto

```
Capta-Prospect/
├── 📄 iniciar.bat          ← Inicia tudo com 1 clique (Windows)
├── 📄 .env.example         ← Template de configuração
├── 📁 docs/                ← Documentação completa
│   ├── 01-instalacao.md
│   ├── 02-configuracao.md
│   ├── 03-como-usar.md
│   └── 04-problemas.md
├── 📁 server/              ← Backend (Motor de Mineração)
│   └── index.js
├── 📁 scripts/             ← Scripts de automação
│   └── ldr_validator.js    ← Crivo LDR
├── 📁 src/                 ← Frontend (Interface)
│   └── App.jsx
├── 📁 convex/              ← Banco de Dados em Nuvem
└── 📁 data/                ← Banco Local (receita_federal.db)
    └── ⚠️ receita_federal.db (entregue separadamente)
```

---

## ⚠️ Arquivo do Banco de Dados

O arquivo `receita_federal.db` **não está no GitHub** por ser muito grande (+2GB).

**Ele é entregue separadamente pelo desenvolvedor do sistema.**

Coloque-o na pasta `data/` antes de usar.

---

*Capta Prospect v3.5.0 — Desenvolvido como solução de prospecção B2B local-first*
