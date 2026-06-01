# Capta Prospect — Como colocar em outra máquina

Existem **dois perfis** de quem vai usar isso. Leia só a seção que te corresponde.

---

## Sou CLIENTE (vou usar o sistema, não desenvolver)

> Você recebeu um arquivo ZIP e um pendrive com o banco de dados. É isso.

### O que instalar (só uma vez na vida)

**Node.js** — é o motor que roda o sistema.
1. Acesse: https://nodejs.org
2. Clique no botão verde **"LTS"** e instale normalmente (Next, Next, Finish).

### O que fazer

**1.** Descompacte o arquivo `capta-prospect-cliente.zip` em qualquer pasta.

**2.** Pegue o arquivo `receita_federal.db` do pendrive e coloque dentro da pasta `data\`
que está dentro da pasta que você acabou de descompactar.
*(Se a pasta `data\` não existir, crie ela manualmente.)*

**3.** Clique duas vezes em `iniciar_cliente.bat`.
Na **primeira vez** ele vai instalar os componentes automaticamente — pode demorar
uns 3 minutos, não feche a janela.

**4.** O navegador abre sozinho em `http://localhost:3007`. Pronto.

**WhatsApp:** na janela preta que fica aberta, vai aparecer um QR Code.
Abra o WhatsApp no celular → Aparelhos conectados → Conectar → escaneie.

### Se algo não funcionar

Abra o navegador e acesse: `http://localhost:3007/status`

Vai aparecer uma tela dizendo exatamente o que está ok e o que falta.

---

## Sou DESENVOLVEDOR (vou editar o código)

> Você vai clonar o repositório e rodar em modo de desenvolvimento.

### O que instalar

- **Node.js** → https://nodejs.org (versão LTS)
- **Git** → https://git-scm.com

### Passo 1 — Baixar o projeto

Abra o terminal (PowerShell) e rode:
```
git clone https://github.com/Jes403/Capta-Prospect.git
cd Capta-Prospect
npm install
```

### Passo 2 — Criar os arquivos de configuração

O projeto precisa de dois arquivos que **não estão no GitHub** (por segurança).

**Arquivo 1 — `.env`** (configurações do servidor)

Copie o arquivo `.env.example` e renomeie para `.env`.
Ele já vem preenchido com as chaves necessárias.

**Arquivo 2 — `.env.local`** (conexão com o banco Convex)

Crie um arquivo chamado `.env.local` com este conteúdo:
```
VITE_CONVEX_URL=https://accurate-tiger-693.convex.cloud
CONVEX_DEPLOYMENT=dev:accurate-tiger-693
VITE_CONVEX_SITE_URL=https://accurate-tiger-693.convex.site
```

### Passo 3 — Banco da Receita Federal

Copie o arquivo `receita_federal.db` (4.1 GB) via pendrive para dentro da pasta `data\`.

### Passo 4 — Rodar o sistema

Clique duas vezes em **`iniciar.bat`**.

Ele abre dois terminais:
- Um para o **Convex** (sincroniza o banco em nuvem)
- Um para o **servidor** (roda o sistema na porta 3007)

Acesse: `http://localhost:3007`

### Passo 5 — Gerar pacote para entregar ao cliente

Quando quiser gerar um novo ZIP para entregar:
```
powershell -ExecutionPolicy Bypass -File gerar_pacote_cliente.ps1
```

Isso compila o frontend e monta a pasta `capta-prospect-cliente\` pronta para zipar e enviar.
