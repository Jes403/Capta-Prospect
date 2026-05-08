const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/receita_federal.db');
const db = new Database(DB_PATH);

console.log('Iniciando otimização profunda do banco de dados...');
console.log('Isso pode levar alguns segundos, mas vai deixar o CRM muito mais rápido.');

try {
    // 1. Criar índices se não existirem
    console.log('[1/3] Garantindo índices de busca rápida...');
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_estab_uf ON estabelecimentos(uf);
        CREATE INDEX IF NOT EXISTS idx_estab_cnae ON estabelecimentos(cnae);
        CREATE INDEX IF NOT EXISTS idx_estab_municipio ON estabelecimentos(municipio);
    `);

    // 2. Analisar estatísticas de busca
    console.log('[2/3] Analisando estatísticas de performance...');
    db.exec('ANALYZE');

    // 3. Compactar o banco (Vacuum)
    console.log('[3/3] Compactando o banco de dados (VACUUM)...');
    db.exec('VACUUM');

    console.log('✅ Banco de dados otimizado com sucesso!');
} catch (error) {
    console.error('❌ Erro na otimização:', error.message);
} finally {
    db.close();
}
