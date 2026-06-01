/**
 * Exporta todos os leads do Convex atual para um arquivo JSON.
 * Execute na máquina original: node scripts/export-convex-leads.js
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const CONVEX_URL = process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ VITE_CONVEX_URL não encontrado em .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

console.log("📦 Conectando ao Convex:", CONVEX_URL);

const leads = await client.query(api.leads.getAll);
const output = { exportedAt: new Date().toISOString(), count: leads.length, leads };
const outPath = join(__dirname, "../leads_export.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`✅ ${leads.length} leads exportados para leads_export.json`);
