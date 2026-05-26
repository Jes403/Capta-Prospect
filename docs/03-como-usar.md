# 🚀 Como Usar o Sistema — Dia a Dia

---

## Iniciando o Sistema (Método Rápido)

Dê um **duplo clique** no arquivo **`iniciar.bat`** na pasta do projeto.

Ele abrirá **3 janelas automaticamente**. Aguarde todas ficarem prontas.

---

## Os 3 Terminais Explicados

### 🟦 Terminal 1 — CONVEX (Banco de Dados em Nuvem)

**Comando:** `npx convex dev`

**O que faz:** Mantém a sincronização dos seus leads e dados do CRM com a nuvem em tempo real.

**Pronto quando aparecer:**
```
✔ Convex functions ready!
```

---

### 🟨 Terminal 2 — BACKEND (Motor de Mineração)

**Comando:** `npm run server`

**O que faz:** É o "cérebro" do sistema. Faz a busca na Receita Federal, processa os leads e gerencia os disparos de WhatsApp.

**Pronto quando aparecer:**
```
[CAPTA-NC] Backend Master rodando na porta 3006
```

---

### 🟩 Terminal 3 — FRONTEND (Interface do Sistema)

**Comando:** `npm run dev`

**O que faz:** Inicia a interface visual que você usa no navegador.

**Pronto quando aparecer:**
```
Local: http://localhost:5173
```

➡️ **Abra o link `http://localhost:5173` no Google Chrome**

---

## Usando o Sistema

### 🔍 Minerando Leads pela Receita Federal

1. Clique na aba **"Receita"** no menu
2. Selecione o **Estado (UF)** e **Cidade**
3. Escolha o **CNAE** (tipo de empresa) ou **Segmento**
4. Clique em **"Escanear"**
5. Aguarde — os leads aparecerão na tela já filtrados pelo Crivo LDR

### 🗺️ Minerando via Google Maps

1. Clique na aba **"Maps"**
2. Digite a **palavra-chave** (ex: "clínica odontológica")
3. Digite a **localização** (ex: "São Paulo, SP")
4. Clique em **"Iniciar Mineração"**
5. Acompanhe os leads chegando em tempo real no console

### 📋 Gerenciando Leads no CRM (Kanban)

1. Clique na aba **"CRM"**
2. Arraste os cards entre as colunas:
   - **Novos Leads** → **Em Contato** → **Qualificados** → **Fechamento**
3. Clique em qualquer lead para ver detalhes e editar

### 📱 Disparando Mensagens no WhatsApp

1. Mova os leads que deseja contatar para a coluna **"Qualificados"**
2. Clique na aba **"WhatsApp"**
3. Edite o template da mensagem (use `[NOME]` para personalização automática)
4. Clique em **"Iniciar Disparos em Massa"**
5. Uma janela do Chrome abrirá com o WhatsApp Web
6. **Escaneie o QR Code** com seu celular (apenas na primeira vez)
7. Acompanhe os envios no console em tempo real

---

## Encerrando o Sistema

Basta fechar as 3 janelas do terminal. Seus dados ficam salvos automaticamente.

---

➡️ [Ver solução de problemas](./03-problemas.md)
