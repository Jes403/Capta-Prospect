const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, '../data/receita_federal.db');
const TURSO_URL = "libsql://capta-jes403.aws-us-east-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzgzODc4MTMsImlkIjoiMDE5ZTEwMjctNjMwMS03NWIxLWExMDMtMzA5M2QwMWQyZDExIiwicmlkIjoiNjdmNjBmNDUtYmQ3ZC00NDQxLTk4NDMtM2UwOTViMmJiMWNhIn0.SqtELBXXp53hhCOwxDQ72llcRRSGYyMGSGOoWBt6OpY-DFWz3wOkO7ciWYdVH9iu57sKVMND1Ih7_lit2uEaDg";

async function migrate() {
    console.log("🔍 Abrindo banco de dados local...");
    const localDb = new Database(SQLITE_PATH);
    const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

    try {
        console.log("🕵️ Detectando estrutura das colunas...");
        const columnsInfo = localDb.prepare("PRAGMA table_info(estabelecimentos)").all();
        const colNames = columnsInfo.map(c => c.name);
        const colCount = colNames.length;
        
        console.log(`✅ Colunas detectadas (${colCount}): ${colNames.join(', ')}`);

        // LIMPEZA: Vamos deletar a tabela antiga no Turso para recriar com as colunas certas
        console.log("🗑️ Removendo tabela antiga no Turso para evitar conflito...");
        try {
            await turso.execute("DROP TABLE IF EXISTS estabelecimentos");
        } catch (e) {
            console.log("⚠️ Nota: Tabela não existia ou já foi removida.");
        }

        console.log("📁 Criando nova tabela correta no Turso...");
        const createTableSql = `CREATE TABLE estabelecimentos (${colNames.map(name => `${name} TEXT`).join(', ')}, PRIMARY KEY(${colNames[0]}))`;
        await turso.execute(createTableSql);

        const count = localDb.prepare("SELECT count(*) as total FROM estabelecimentos").get().total;
        console.log(`📊 Total: ${count} registros.`);

        const CHUNK_SIZE = 100; 
        let offset = 0;
        
        const placeholders = new Array(colCount).fill('?').join(',');
        const insertSql = `INSERT OR REPLACE INTO estabelecimentos (${colNames.join(',')}) VALUES (${placeholders})`;

        console.log("🚀 Iniciando migração pesada...");

        while (true) {
            const rows = localDb.prepare("SELECT * FROM estabelecimentos LIMIT ? OFFSET ?").all(CHUNK_SIZE, offset);
            if (rows.length === 0) break;

            const queries = rows.map(row => ({
                sql: insertSql,
                args: Object.values(row)
            }));

            await turso.batch(queries);
            
            offset += rows.length;
            const percent = ((offset / count) * 100).toFixed(4);
            console.log(`📦 Enviados: ${offset} / ${count} (${percent}%)`);
        }

        console.log("✨ TUDO PRONTO!");
    } catch (err) {
        console.error("❌ ERRO:", err.message);
    }
}

migrate();
