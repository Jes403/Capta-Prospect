# Capta Prospect
### Sistema de Prospecção B2B — Local-First

> Mineração de leads via Receita Federal, Google Maps e automação de WhatsApp com IA.

---

## Início Rápido

### Já tenho o projeto e quero atualizar

Abra o terminal na pasta do projeto e rode:

```
git pull
```

Depois clique duas vezes em **`iniciar.bat`** (desenvolvedor) ou **`iniciar_cliente.bat`** (cliente).

---

### Primeira vez — quero instalar do zero

Siga o guia: [SETUP_NOVA_MAQUINA.md](./SETUP_NOVA_MAQUINA.md)

---

## Como funciona

O sistema roda **em 1 só porta** no seu computador.

```
┌─────────────────────────────────────────┐
│           CAPTA PROSPECT                │
│                                         │
│  node server/index.js                   │
│                                         │
│  Frontend + Backend + API               │
│  http://localhost:3007                  │
└─────────────────────────────────────────┘
```

- **Desenvolvedor** → clica em `iniciar.bat` (abre Convex + servidor)
- **Cliente** → clica em `iniciar_cliente.bat` (abre só o servidor)

---

## Funcionalidades

- **Mineração Receita Federal** — Base local com milhões de empresas
- **Mineração Google Maps** — Busca automática com avaliações
- **Qualificação por IA** — Gemini analisa site, e-mail e sócio da empresa
- **CRM Kanban** — Pipeline de vendas com drag & drop
- **Automação WhatsApp** — Disparos personalizados com acompanhamento
- **Caixa de Entrada WhatsApp** — Leitura de mensagens recebidas

---

## Pré-Requisitos

| Programa | Download |
|---|---|
| Node.js (LTS) | https://nodejs.org |
| Git | https://git-scm.com |

---

## Estrutura do Projeto

```
Capta-Prospect/
├── iniciar.bat              ← Desenvolvedor: inicia Convex + servidor
├── iniciar_cliente.bat      ← Cliente: inicia só o servidor
├── gerar_pacote_cliente.ps1 ← Gera o ZIP para entregar ao cliente
├── .env.example             ← Configurações (copie e renomeie para .env)
├── server/
│   ├── index.js             ← Servidor principal (porta 3007)
│   └── whatsapp.js          ← Integração WhatsApp (Baileys)
├── src/                     ← Frontend React
├── convex/                  ← Banco de dados em nuvem (Convex)
└── data/
    └── receita_federal.db   ← Banco local (entregue separadamente, ~4GB)
```

---

## Diagnóstico

Se algo não funcionar, acesse `http://localhost:3007/status` para ver o que está ok e o que falta.

---

*Capta Prospect — Prospecção B2B local-first*
