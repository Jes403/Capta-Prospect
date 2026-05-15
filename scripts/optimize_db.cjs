const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/receita_federal.db');
const db = new Database(DB_FILE);

console.log('--- [🕵️‍♂️] ANALISANDO ÍNDICES ---');
const indices = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index'").all();
console.log('Índices atuais:', JSON.stringify(indices, null, 2));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tabelas:', JSON.stringify(tables, null, 2));

if (indices.length < 3) {
    console.log('[🚀] Criando índices para acelerar o SCAN...');
    try {
        db.prepare("CREATE INDEX IF NOT EXISTS idx_uf ON estabelecimentos(uf)").run();
        console.log('[✅] Índice UF criado.');
        db.prepare("CREATE INDEX IF NOT EXISTS idx_municipio ON estabelecimentos(municipio)").run();
        console.log('[✅] Índice MUNICIPIO criado.');
        db.prepare("CREATE INDEX IF NOT EXISTS idx_cnae ON estabelecimentos(cnae)").run();
        console.log('[✅] Índice CNAE criado.');
        db.prepare("CREATE INDEX IF NOT EXISTS idx_cnpj_basico ON socios(cnpj_basico)").run();
        console.log('[✅] Índice CNPJ_BASICO (Socios) criado.');
    } catch (e) {
        console.error('[❌] Erro ao criar índices:', e.message);
    }
}

console.log('--- [✅] OTIMIZAÇÃO CONCLUÍDA ---');
db.close();
