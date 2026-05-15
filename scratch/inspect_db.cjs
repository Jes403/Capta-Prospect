const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/receita_federal.db');
console.log('Inspecionando banco em:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n--- ESTRUTURA DA TABELA ---');
  const columns = db.prepare("PRAGMA table_info(estabelecimentos)").all();
  columns.forEach(c => console.log(`- ${c.name} (${c.type})`));

  console.log('\n--- PRIMEIROS 5 REGISTROS ---');
  const rows = db.prepare("SELECT * FROM estabelecimentos LIMIT 5").all();
  console.log(JSON.stringify(rows, null, 2));

  console.log('\n--- TESTE DE CONTAGEM ---');
  const count = db.prepare("SELECT count(*) as total FROM estabelecimentos").get();
  console.log('Total de leads na base:', count.total);

  db.close();
} catch (e) {
  console.error('ERRO AO ACESSAR BANCO:', e.message);
}
