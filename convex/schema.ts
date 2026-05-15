import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Tabelas de autenticação (gerenciadas pelo @convex-dev/auth)
  ...authTables,

  // Tabela de leads do CRM
  leads: defineTable({
    name: v.string(),
    contact: v.optional(v.string()),
    email: v.optional(v.string()),
    phones: v.optional(v.array(v.string())),
    loc: v.optional(v.string()),
    origin: v.string(), // 'Receita' | 'LinkedIn' | 'Manual'
    status: v.string(), // 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
    site: v.optional(v.string()),
    instagram: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    security_hook: v.optional(v.boolean()),
    dono: v.optional(v.string()),
    socio: v.optional(v.string()),
    notes: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_origin", ["origin"])
    .index("by_created", ["createdAt"]),

  // Configurações do usuário/empresa
  settings: defineTable({
    userId: v.id("users"),
    companyName: v.optional(v.string()),
    targetStates: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"]),
});
