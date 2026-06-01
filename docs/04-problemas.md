# Solução de Problemas

> Antes de qualquer coisa, acesse **http://localhost:3007/status** — essa página mostra exatamente o que está ok e o que falta.

---

## O servidor não inicia / tela preta fecha sozinha

**Causa mais comum:** Node.js não está instalado.

**Solução:**
1. Instale o Node.js: https://nodejs.org (versão LTS)
2. Reinicie o computador
3. Tente novamente

---

## Nenhum lead aparece na extração da Receita Federal

**Causa:** O banco de dados não está no lugar certo.

**Solução:**
1. Verifique se existe a pasta `data\` dentro da pasta do projeto
2. Verifique se o arquivo `receita_federal.db` está dentro de `data\`
3. Caminho correto: `Capta-Prospect\data\receita_federal.db`

---

## Qualificação não funciona (site, e-mail, sócio não aparecem)

**Causa:** Chave do Gemini não configurada.

**Solução:**
1. Abra o arquivo `.env` na pasta do projeto
2. Verifique se `GEMINI_API_KEY` está preenchida
3. Se estiver vazia, obtenha uma chave em: https://aistudio.google.com/app/apikey

---

## Porta 3007 já está em uso

**Causa:** O servidor já está rodando em segundo plano.

**Solução:** O `iniciar_cliente.bat` já resolve isso automaticamente.
Se preferir fazer manual, abra o CMD e execute:
```
taskkill /F /IM node.exe
```

---

## O site abre mas fica tela branca

**Causa:** Cache do navegador.

**Solução:** Pressione `Ctrl + Shift + R` no navegador (atualização forçada).

---

## WhatsApp não conecta / QR Code não aparece

**Solução:**
1. Feche o sistema
2. Delete a pasta **`wa_session_baileys`** dentro da pasta do projeto
3. Inicie novamente e escaneie o QR Code

---

## Preciso atualizar o sistema com a última versão

Abra o CMD na pasta do projeto e execute:
```
git pull
```

Depois reinicie com o `iniciar.bat` ou `iniciar_cliente.bat`.
