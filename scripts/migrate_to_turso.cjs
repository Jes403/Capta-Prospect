const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, '../data/receita_federal.db');
const TURSO_URL = "libsql://capta-jes403.aws-us-east-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzgzODc4MTMsImlkIjoiMDE5ZTEwMjctNjMwMS03NWIxLWExMDMtMzA5M2QwMWQyZDExIiwicmlkIjoiNjdmNjBmNDUtYmQ3ZC00NDQxLTk4NDMtM2UwOTViMmJiMWNhIn0.SqtELBXXp53hhCOwxDQ72llcRRSGYyMGSGOoWBt6OpY-DFWz3wOkO7ciWYdVH9iu57sKVMND1Ih7_lit2uEaDg";

async function migrate() {
    const args = process.argv.slice(2);
    const startArg = args.find(a => a.startsWith('--start='));
    const initialOffset = startArg ? parseInt(startArg.split('=')[1]) : 0;

    console.log("🔍 Abrindo banco local...");
    const localDb = new Database(SQLITE_PATH, { readonly: true, timeout: 15000 });
    const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

    try {
        const columnsInfo = localDb.prepare("PRAGMA table_info(estabelecimentos)").all();
        const colNames = columnsInfo.map(c => c.name);
        const colCount = colNames.length;
        
        const count = 11448620;
        const CHUNK_SIZE = 1000; 
        const PARALLEL_BATCHES = 5; // Reduzi um pouco para evitar "fetch failed"
        const TOTAL_STEP_SIZE = CHUNK_SIZE * PARALLEL_BATCHES;
        let offset = initialOffset;
        let lastId = null;

        if (initialOffset > 0) {
            console.log(`⏩ Localizando ponto de retomada: ${initialOffset}...`);
            const startRow = localDb.prepare("SELECT id FROM estabelecimentos LIMIT 1 OFFSET ?").get(initialOffset);
            if (startRow) lastId = startRow.id;
        }

        const placeholders = new Array(colCount).fill('?').join(',');
        const insertSql = `INSERT OR REPLACE INTO estabelecimentos (${colNames.join(',')}) VALUES (${placeholders})`;

        console.log("🚀 Iniciando transferência (MODO RESILIENTE ATIVADO)...");
        const startTime = Date.now();

        while (true) {
            let allRows;
            if (lastId === null) {
                allRows = localDb.prepare("SELECT * FROM estabelecimentos ORDER BY id ASC LIMIT ?").all(TOTAL_STEP_SIZE);
            } else {
                allRows = localDb.prepare("SELECT * FROM estabelecimentos WHERE id > ? ORDER BY id ASC LIMIT ?").all(lastId, TOTAL_STEP_SIZE);
            }
            
            if (allRows.length === 0) break;

            // Lógica de tentativa (Retry) para evitar "fetch failed"
            let success = false;
            let retries = 3;

            while (!success && retries > 0) {
                try {
                    const batchPromises = [];
                    for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
                        const chunk = allRows.slice(i, i + CHUNK_SIZE);
                        const queries = chunk.map(row => ({
                            sql: insertSql,
                            args: Object.values(row)
                        }));
                        batchPromises.push(turso.batch(queries));
                    }
                    await Promise.all(batchPromises);
                    success = true;
                } catch (e) {
                    retries--;
                    console.log(`\n⚠️ Oscilação de rede detectada. Tentando novamente em 2s... (${retries} restantes)`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            if (!success) throw new Error("Falha persistente na conexão com o Turso.");

            offset += allRows.length;
            lastId = allRows[allRows.length - 1].id; 
            
            const percent = ((offset / count) * 100).toFixed(2);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = (offset - initialOffset) / elapsed; 
            
            const barLength = 20;
            const completedBars = Math.floor((offset / count) * barLength);
            const progressBar = "█".repeat(completedBars) + "░".repeat(barLength - completedBars);

            process.stdout.write(`\r⚡ [${progressBar}] ${percent}% | 📦 ${offset.toLocaleString()} / ${count.toLocaleString()} | 🚀 ${speed.toFixed(0)} reg/s`);

            if (allRows.length < TOTAL_STEP_SIZE) break;
        }

        console.log("\n\n✨ MIGRAÇÃO CONCLUÍDA!");
    } catch (err) {
        console.error("\n❌ ERRO FATAL:", err.message);
    }
}

migrate();
