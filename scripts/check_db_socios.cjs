const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = 'C:/Users/leira/projetos profissionais/capta-prospect/data/receita_federal.db';

try {
  const db = new Database(DB_PATH);
  const count = db.prepare('SELECT COUNT(*) as count FROM socios').get();
  console.log(`Total de registros na tabela socios: ${count.count}`);
  
  // Vamos ver os primeiros 5 registros para conferir o formato
  const rows = db.prepare('SELECT * FROM socios LIMIT 5').all();
  console.log('Exemplos de registros:', JSON.stringify(rows, null, 2));
  
  db.close();
} catch (err) {
  console.error('Erro ao acessar o banco:', err.message);
}
