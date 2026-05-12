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

    console.log("🔍 Abrindo banco de dados local (Modo Seguro)...");
    const localDb = new Database(SQLITE_PATH, { readonly: true, timeout: 10000 });
    const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

    try {
        console.log("🕵️ Detectando estrutura das colunas...");
        const columnsInfo = localDb.prepare("PRAGMA table_info(estabelecimentos)").all();
        const colNames = columnsInfo.map(c => c.name);
        const colCount = colNames.length;
        
        console.log(`✅ Colunas detectadas (${colCount}): ${colNames.join(', ')}`);

        if (initialOffset === 0) {
            console.log("🗑️ Removendo tabela antiga no Turso para iniciar do zero...");
            try { await turso.execute("DROP TABLE IF EXISTS estabelecimentos"); } catch (e) {}

            console.log("📁 Criando nova tabela no Turso...");
            const createTableSql = `CREATE TABLE estabelecimentos (${colNames.map(name => `${name} TEXT`).join(', ')}, PRIMARY KEY(${colNames[0]}))`;
            await turso.execute(createTableSql);
        }

        const count = 11448620;
        const CHUNK_SIZE = 1000; 
        const PARALLEL_BATCHES = 10; 
        const TOTAL_STEP_SIZE = CHUNK_SIZE * PARALLEL_BATCHES;
        let offset = initialOffset;
        let lastId = null;

        if (initialOffset > 0) {
            console.log(`🔍 Localizando ID de partida no registro ${initialOffset} (Isso pode levar 1 min)...`);
            const startRow = localDb.prepare("SELECT id FROM estabelecimentos LIMIT 1 OFFSET ?").get(initialOffset);
            if (startRow) lastId = startRow.id;
        }

        const placeholders = new Array(colCount).fill('?').join(',');
        const insertSql = `INSERT OR REPLACE INTO estabelecimentos (${colNames.join(',')}) VALUES (${placeholders})`;

        console.log("🚀 Iniciando transferência (MODO BUSCA DIRETA ATIVADO)...");
        const startTime = Date.now();

        while (true) {
            let allRows;
            if (lastId === null) {
                allRows = localDb.prepare("SELECT * FROM estabelecimentos ORDER BY id ASC LIMIT ?").all(TOTAL_STEP_SIZE);
            } else {
                allRows = localDb.prepare("SELECT * FROM estabelecimentos WHERE id > ? ORDER BY id ASC LIMIT ?").all(lastId, TOTAL_STEP_SIZE);
            }
            
            if (allRows.length === 0) break;

            const batchPromises = [];
            for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
                const chunk = allRows.slice(i, i + CHUNK_SIZE);
                const queries = chunk.map(row => ({
                    sql: insertSql,
                    args: Object.values(row)
                }));
                batchPromises.push(turso.batch(queries).then(() => chunk.length));
            }

            const results = await Promise.all(batchPromises);
            const totalInThisStep = results.reduce((a, b) => a + b, 0);
            
            offset += totalInThisStep;
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

        console.log("\n\n✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
    } catch (err) {
        console.error("\n❌ ERRO:", err.message);
    }
}

migrate();
