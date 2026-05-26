# ⚙️ Guia de Configuração — Primeiro Uso

> Siga estes passos apenas **uma vez**, na primeira vez que abrir o sistema.

---

## Passo 1 — Baixar o Projeto

Abra o **Prompt de Comando** (CMD) e execute os comandos abaixo, um por vez:

```bash
git clone https://github.com/Jes403/Capta-Prospect.git
```

```bash
cd Capta-Prospect
```

---

## Passo 2 — Instalar as Dependências

Ainda no CMD, dentro da pasta do projeto, execute:

```bash
npm install
```

> ⏳ Aguarde. Pode levar de 2 a 5 minutos. Não feche a janela.
>
> No final, deve aparecer algo como: `added 486 packages`

---

## Passo 3 — Criar o Arquivo de Configuração

Você precisa criar um arquivo chamado **`.env`** na pasta raiz do projeto.

### Como fazer:

1. Abra a pasta do projeto no **Explorador de Arquivos**
2. Procure o arquivo chamado **`.env.example`**
3. **Copie** esse arquivo e cole na mesma pasta
4. **Renomeie a cópia** de `.env.example` para `.env`

> ⚠️ O arquivo começa com ponto (`.env`). O Windows pode esconder ele.  
> Para ver arquivos ocultos: Explorador de Arquivos → Exibir → marcar "Itens ocultos"

5. Abra o arquivo `.env` com o **Bloco de Notas**
6. Preencha com suas chaves (veja instruções abaixo)

### Obtendo as chaves de API:

**GEMINI_API_KEY** (Inteligência Artificial para qualificação de leads):
- Acesse: https://aistudio.google.com/app/apikey
- Clique em **"Create API Key"**
- Copie a chave gerada e cole no arquivo `.env`

**GOOGLE_MAPS_API_KEY** (Mineração via Google Maps):
- Acesse: https://console.cloud.google.com/
- Crie um projeto e ative a API "Places API"
- Gere uma chave e cole no arquivo `.env`

---

## Passo 4 — Banco de Dados (Receita Federal)

O arquivo do banco de dados é muito grande para o GitHub (+2GB), por isso ele é entregue separadamente.

1. Crie uma pasta chamada **`data`** dentro da pasta do projeto
2. Copie o arquivo **`receita_federal.db`** para dentro da pasta `data`

Estrutura correta:
```
Capta-Prospect/
  └── data/
      └── receita_federal.db  ✅
```

---

## Passo 5 — Login no Convex (Banco de Dados em Nuvem)

Na **primeira vez** que você iniciar o sistema, o terminal do Convex vai pedir que você faça login:

1. Inicie o sistema com o `iniciar.bat`
2. No **Terminal 1 (Convex)**, vai aparecer um link
3. Copie o link e abra no navegador
4. Faça login com sua conta **Google**
5. Volte ao terminal — ele vai continuar automaticamente

> ✅ Este login é salvo. Você não precisará fazer novamente.

---

## ✅ Configuração Concluída!

Agora você pode iniciar o sistema normalmente todos os dias.

➡️ [Como iniciar o sistema todo dia](./02-como-usar.md)
