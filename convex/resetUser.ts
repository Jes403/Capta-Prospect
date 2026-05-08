import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ATENÇÃO: Esta é uma ferramenta de emergência para resetar a senha.
// Ela deve ser deletada após o uso.
export const forceResetPassword = mutation({
  args: { email: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    // Busca o usuário pelo email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();

    if (!user) {
      return "Usuário não encontrado.";
    }

    // O @convex-dev/auth gerencia as senhas em tabelas internas.
    // Para resetar manualmente sem a hash correta é complexo via DB direto.
    // A melhor forma é deletar o usuário para permitir o 'signUp' novamente
    // OU deletar apenas a conta de autenticação vinculada.
    
    // Vamos deletar o usuário e suas contas para um "fresh start"
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }
    
    await ctx.db.delete(user._id);

    return `Usuário ${args.email} deletado com sucesso. Agora você pode se registrar novamente (Sign Up) com a nova senha.`;
  },
});
