# Configuração — Primeiro Uso

> Siga estes passos apenas **uma vez**.

---

## Passo 1 — Baixar o projeto

Abra o CMD e execute:

```
git clone https://github.com/Jes403/Capta-Prospect.git
cd Capta-Prospect
npm install
```

> Aguarde o `npm install` terminar — pode demorar alguns minutos.

---

## Passo 2 — Criar o arquivo `.env`

1. Abra a pasta do projeto no Explorador de Arquivos
2. Localize o arquivo **`.env.example`**
3. Copie e renomeie a cópia para **`.env`** (sem o ".example")

> O arquivo já vem com as chaves necessárias preenchidas.
> Você não precisa alterar nada, a menos que queira usar suas próprias chaves.

---

## Passo 3 — Criar o arquivo `.env.local` *(só para desenvolvedor)*

Crie um arquivo chamado `.env.local` na raiz do projeto com este conteúdo:

```
VITE_CONVEX_URL=https://accurate-tiger-693.convex.cloud
CONVEX_DEPLOYMENT=dev:accurate-tiger-693
VITE_CONVEX_SITE_URL=https://accurate-tiger-693.convex.site
```

---

## Passo 4 — Banco de Dados da Receita Federal

O banco tem ~4 GB e não está no GitHub — é entregue separadamente.

1. Crie a pasta **`data`** dentro da pasta do projeto (se não existir)
2. Coloque o arquivo **`receita_federal.db`** dentro da pasta `data`

```
Capta-Prospect/
  └── data/
      └── receita_federal.db  ✅
```

---

## Passo 5 — Iniciar o sistema

Clique duas vezes em **`iniciar.bat`**.

Ele abre dois terminais:
- **Convex** — sincroniza o banco de dados na nuvem
- **Servidor** — roda o sistema na porta 3007

Acesse: **http://localhost:3007**

---

Próximo passo: [Como usar o sistema](./03-como-usar.md)
