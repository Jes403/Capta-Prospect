const Database = require('better-sqlite3');
const DB_PATH = 'C:/Users/leira/projetos profissionais/capta-prospect/data/receita_federal.db';

try {
  const db = new Database(DB_PATH);
  const count = db.prepare('SELECT COUNT(*) as count FROM socios').get();
  console.log(`Total de registros na tabela socios: ${count.count}`);
  
  // Também vamos verificar se existem registros de diferentes arquivos (se houver alguma marcação, mas o script original não adiciona)
  // Mas podemos ver a distribuição por CNPJ básico ou algo assim.
  
  db.close();
} catch (err) {
  console.error('Erro ao acessar o banco:', err.message);
}
