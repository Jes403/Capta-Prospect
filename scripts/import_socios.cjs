const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const { parse } = require('csv-parse');

// Configurações de Caminho
const DB_PATH = 'C:/Users/leira/projetos profissionais/capta-prospect/data/receita_federal.db';
const DOWNLOADS_DIR = 'C:/Users/leira/Downloads/2026-04/2026-04';

const db = new Database(DB_PATH);

// 1. Preparar o Banco
console.log('--- PREPARANDO BANCO DE DADOS ---');
// Vamos recriar a tabela para garantir que as colunas estejam corretas
db.exec(`
  DROP TABLE IF EXISTS socios;
  CREATE TABLE socios (
    cnpj_basico TEXT,
    identificador TEXT,
    nome_socio TEXT
  );
  CREATE INDEX idx_socios_cnpj ON socios(cnpj_basico);
`);

async function processZip(zipPath) {
  console.log(`\n📦 Processando: ${path.basename(zipPath)}...`);
  
  const directory = await unzipper.Open.file(zipPath);
  const file = directory.files[0]; 
  
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = file.stream()
      .pipe(parse({
        delimiter: ';',
        relax_column_count: true,
        quote: '"',
        escape: '"'
      }));

    const insert = db.prepare('INSERT INTO socios (cnpj_basico, identificador, nome_socio) VALUES (?, ?, ?)');
    
    // Transação para alta performance
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        // Formato RF: 0=CNPJ_BASE, 1=IDENTIFICADOR, 2=NOME_SOCIO
        insert.run(row[0], row[1], row[2]);
      }
    });

    let batch = [];
    stream.on('data', (row) => {
      batch.push(row);
      if (batch.length >= 5000) {
        insertMany(batch);
        count += batch.length;
        process.stdout.write(`\r✅ Inseridos: ${count} registros...`);
        batch = [];
      }
    });

    stream.on('end', () => {
      if (batch.length > 0) {
        insertMany(batch);
        count += batch.length;
      }
      console.log(`\n✨ Finalizado ${path.basename(zipPath)}: ${count} nomes importados.`);
      resolve();
    });

    stream.on('error', (err) => {
      console.error(`\n❌ Erro no arquivo ${zipPath}:`, err.message);
      reject(err);
    });
  });
}

async function start() {
  console.log('🚀 Iniciando Motor de Importação Capta Prospect...');
  
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR)
      .filter(f => f.startsWith('Socios') && f.endsWith('.zip'))
      .sort();

    if (files.length === 0) {
      console.error('❌ Nenhum arquivo "Socios*.zip" encontrado na pasta Downloads!');
      return;
    }

    for (const file of files) {
      await processZip(path.join(DOWNLOADS_DIR, file));
    }

    console.log('\n🏆 IMPORTAÇÃO COMPLETA! O seu CRM agora conhece os donos das empresas.');
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  } finally {
    db.close();
  }
}

start();
