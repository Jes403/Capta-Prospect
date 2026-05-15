import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Busca todos os leads do CRM do usuário autenticado
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // Modo Local: Permitir acesso sem autenticação para estabilidade
    if (!userId) {
      return await ctx.db
        .query("leads")
        .order("desc")
        .collect();
    }
    
    return await ctx.db
      .query("leads")
      .order("desc")
      .collect();
  },
});

// Query para buscar usuário pelo email (Auxiliar para Reset)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .unique();
  },
});

// Busca leads por status (coluna do Kanban)
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    const userId = await getAuthUserId(ctx);
    // Modo Local: Permitir acesso sem autenticação
    if (!userId) {
      return await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    }
    
    return await ctx.db
      .query("leads")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
  },
});

// Adiciona um novo lead ao CRM
export const add = mutation({
  args: {
    name: v.string(),
    contact: v.optional(v.string()),
    email: v.optional(v.string()),
    phones: v.optional(v.array(v.string())),
    loc: v.optional(v.string()),
    origin: v.string(),
    site: v.optional(v.string()),
    instagram: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    dono: v.optional(v.string()),
    socio: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    security_hook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // Modo Local: Permitir inserção sem auth
    // if (!userId) throw new Error("Não autenticado.");
    
    const { status, ...rest } = args;
    const now = Date.now();
    return await ctx.db.insert("leads", {
      ...rest,
      status: status || "leads",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Atualiza o status (movimento de coluna no Kanban)
export const updateStatus = mutation({
  args: {
    id: v.id("leads"),
    status: v.string(),
  },
  handler: async (ctx, { id, status }) => {
    const userId = await getAuthUserId(ctx);
    // if (!userId) throw new Error("Não autenticado.");
    
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
  },
});

// Atualiza detalhes completos do lead (Trello Edit Modal)
export const updateDetails = mutation({
  args: {
    id: v.id("leads"),
    name: v.optional(v.string()),
    contact: v.optional(v.string()),
    email: v.optional(v.string()),
    loc: v.optional(v.string()),
    socio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    site: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    security_hook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

// Atualiza notas de um lead
export const updateNotes = mutation({
  args: {
    id: v.id("leads"),
    notes: v.string(),
  },
  handler: async (ctx, { id, notes }) => {
    const userId = await getAuthUserId(ctx);
    // if (!userId) throw new Error("Não autenticado.");
    
    await ctx.db.patch(id, { notes, updatedAt: Date.now() });
  },
});

// Remove um lead
export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    // if (!userId) throw new Error("Não autenticado.");
    
    await ctx.db.delete(id);
  },
});

// ATENÇÃO: Mutação de emergência para reset de senha (DELETAR APÓS USO)
export const forceResetPasswordPublic = mutation({
  args: { email: v.string(), secret: v.string() },
  handler: async (ctx, { email, secret }) => {
    if (secret !== "Jesse403_RESET_FORCE") throw new Error("Não autorizado");
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .unique();

    if (!user) return "Usuário não encontrado.";

    // Deletar contas
    const accounts = await ctx.db.query("authAccounts").collect();
    const userAccounts = accounts.filter(a => a.userId === user._id);
    for (const account of userAccounts) {
      await ctx.db.delete(account._id);
    }
    
    // Deletar sessões
    const sessions = await ctx.db.query("authSessions").collect();
    const userSessions = sessions.filter(s => s.userId === user._id);
    for (const session of userSessions) {
      await ctx.db.delete(session._id);
    }
    
    // Deletar usuário
    await ctx.db.delete(user._id);

    return "Sucesso: Usuário deletado. Pode registrar novamente.";
  },
});
