import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Rota de emergência para resetar o usuário (será removida após o uso)
http.route({
  path: "/api/reset-user",
  method: "POST",
  handler: async (ctx, request) => {
    const { email, password } = await request.json();
    if (password !== "Jesse403_RESET_FORCE") return new Response("Não autorizado", { status: 401 });
    
    // Busca o usuário
    const user = await ctx.runQuery(api.leads.getUserByEmail, { email });
    if (!user) return new Response("Usuário não encontrado", { status: 404 });

    // Deleta contas e usuário
    await ctx.runMutation(api.resetUser.forceResetPassword, { email, newPassword: "N/A" });
    
    return new Response("Usuário resetado. Prossiga com o Sign Up.");
  },
});

// Rotas de autenticação (login, logout, etc)
auth.addHttpRoutes(http);

export default http;
