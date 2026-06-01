/**
 * Importa leads de leads_export.json para o novo projeto Convex.
 * Execute na nova máquina: node scripts/import-convex-leads.js
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "fs";
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

const exportPath = join(__dirname, "../leads_export.json");
let data;
try {
  data = JSON.parse(readFileSync(exportPath, "utf-8"));
} catch {
  console.error("❌ Arquivo leads_export.json não encontrado. Copie da máquina original.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
console.log(`📦 Importando ${data.count} leads para:`, CONVEX_URL);

let ok = 0, fail = 0;
for (const lead of data.leads) {
  // Remover campos internos do Convex (_id, _creationTime)
  const { _id, _creationTime, ...cleanLead } = lead;
  try {
    await client.mutation(api.leads.add, cleanLead);
    ok++;
    process.stdout.write(`\r✅ ${ok}/${data.count} importados...`);
  } catch (e) {
    fail++;
    console.error(`\n❌ Falha em "${lead.name}":`, e.message);
  }
}

console.log(`\n\n✅ Concluído: ${ok} importados, ${fail} falhas.`);
