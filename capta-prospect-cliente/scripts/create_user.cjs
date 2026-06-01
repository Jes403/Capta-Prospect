// Script para criar o primeiro usuário no Convex Auth
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://accurate-tiger-693.convex.cloud");

async function createUser() {
  console.log("[CAPTA] Criando usuário no Convex Auth...");

  try {
    // Chama a action de signIn com flow 'signUp' para criar o usuário
    const result = await client.action("auth:signIn", {
      provider: "password",
      params: {
        email: "leirascruz@gmail.com",
        password: "Jesse403",
        flow: "signUp",
      },
    });

    console.log("[SUCCESS] Usuário criado com sucesso!");
    console.log("Email: leirascruz@gmail.com");
    console.log("Resultado:", JSON.stringify(result, null, 2));
  } catch (err) {
    // Se já existe, tenta apenas confirmar o login
    if (err.message?.includes("already") || err.message?.includes("exists")) {
      console.log("[INFO] Usuário já existe. Tentando verificar login...");
      try {
        const loginResult = await client.action("auth:signIn", {
          provider: "password",
          params: {
            email: "leirascruz@gmail.com",
            password: "Jesse403",
            flow: "signIn",
          },
        });
        console.log("[SUCCESS] Login verificado com sucesso!");
        console.log(JSON.stringify(loginResult, null, 2));
      } catch (loginErr) {
        console.error("[ERRO no login]", loginErr.message);
      }
    } else {
      console.error("[ERRO ao criar usuário]", err.message);
    }
  }
}

createUser();
