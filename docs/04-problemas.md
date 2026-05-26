# 🛠️ Solução de Problemas

> Encontrou um erro? Procure o problema abaixo e siga a solução.

---

## ❌ "npm: command not found" ou "npm não é reconhecido"

**Causa:** O Node.js não foi instalado corretamente ou o computador não foi reiniciado.

**Solução:**
1. Reinstale o Node.js: https://nodejs.org/en/download
2. **Reinicie o computador**
3. Abra um novo CMD e tente novamente

---

## ❌ Porta 3006 já está em uso

**Causa:** O servidor backend já está rodando em segundo plano.

**Solução:** Abra o CMD e execute:
```bash
taskkill /F /IM node.exe
```
Depois inicie o sistema novamente.

---

## ❌ O site não abre (localhost:5173)

**Causa:** O Frontend (Terminal 3) ainda não terminou de iniciar, ou o Backend (Terminal 2) não está rodando.

**Solução:**
1. Verifique se os **3 terminais** estão abertos e mostrando as mensagens de "pronto"
2. Espere todos os 3 terminarem de carregar
3. Tente acessar novamente

---

## ❌ "Convex functions ready" não aparece

**Causa:** Pode ser problema de internet ou de login no Convex.

**Solução:**
1. Verifique sua conexão com a internet
2. No Terminal 1, pressione `Ctrl+C` para parar
3. Execute novamente: `npx convex dev`
4. Se pedir login, clique no link e faça login com sua conta Google

---

## ❌ Nenhum lead aparece na busca da Receita

**Causa:** O arquivo do banco de dados não está no lugar certo.

**Solução:**
1. Verifique se existe a pasta `data/` dentro do projeto
2. Verifique se o arquivo `receita_federal.db` está dentro de `data/`
3. O caminho correto é: `Capta-Prospect/data/receita_federal.db`

---

## ❌ WhatsApp Web não conecta / QR Code não aparece

**Causa:** A sessão anterior corrompeu.

**Solução:**
1. Feche todos os terminais
2. Vá até a pasta do projeto
3. Delete a pasta **`wa_session`** (se existir)
4. Inicie o sistema novamente
5. Escaneie o QR Code com seu celular

---

## ❌ Erro "ENOENT: no such file or directory"

**Causa:** O sistema não encontrou um arquivo necessário.

**Solução:**
1. Verifique se você está na pasta certa do projeto
2. Execute `npm install` novamente
3. Verifique se o arquivo `.env` existe (não apenas o `.env.example`)

---

## ❌ A tela fica branca / carregando infinito

**Causa:** Problema de cache do navegador.

**Solução:**
1. Pressione `Ctrl + Shift + R` no Chrome (força atualização)
2. Se não funcionar, abra uma aba anônima (`Ctrl + Shift + N`) e acesse `http://localhost:5173`

---

## 📞 Problema não listado aqui?

Entre em contato com o suporte do sistema descrevendo:
1. O que você estava fazendo quando o erro aconteceu
2. Qual mensagem de erro apareceu
3. Em qual terminal (1, 2 ou 3) o erro apareceu

---

➡️ [Voltar ao guia de uso](./03-como-usar.md)
