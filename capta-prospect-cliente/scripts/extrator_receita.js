import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import unzipper from 'unzipper';

/**
 * CAPTA PROSPECT - EXTRATOR RECEITA FEDERAL (Versão ESM)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A Receita Federal migrou para o OwnCloud. A URL de download direta precisa dos parâmetros path e files.
const OWNCLOUD_SHARE_ID = 'YggdBLfdninEJX9';
const FOLDER_PATH = '%2F2026-04'; // O %2F é a barra codificada da URL (/2026-04)
const TARGET_FILE = 'Estabelecimentos0.zip'; // O arquivo inicial (tem do 0 ao 9)

const fileUrl = `https://arquivos.receitafederal.gov.br/index.php/s/${OWNCLOUD_SHARE_ID}/download?path=${FOLDER_PATH}&files=${TARGET_FILE}`;

const OUTPUT_DIR = path.join(__dirname, '../data/raw');
const EXTRACT_DIR = path.join(__dirname, '../data/extracted');

async function downloadData() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const filePath = path.join(OUTPUT_DIR, TARGET_FILE);
    const url = fileUrl;

    console.log(`[LOG] Iniciando download de: ${url}`);
    
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`[SUCCESS] Download concluído: ${filePath}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`[ERROR] Falha no download: ${error.message}`);
    }
}

async function extractData() {
    const zipPath = path.join(OUTPUT_DIR, TARGET_FILE);
    const extractPath = path.join(__dirname, '../data/extracted');

    if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
    }

    console.log(`[LOG] Extraindo arquivos para: ${extractPath}`);

    try {
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractPath }))
            .promise();
        console.log('[SUCCESS] Extração finalizada.');
    } catch (error) {
        console.error(`[ERROR] Erro na extração: ${error.message}`);
    }
}

// Fluxo Principal
(async () => {
    console.log('--- CAPTA NC: COMANDO DE EXTRAÇÃO INICIADO ---');
    const zipPath = path.join(OUTPUT_DIR, TARGET_FILE);
    
    if (!fs.existsSync(zipPath)) {
        console.log('[INFO] Iniciando o download da base...');
        await downloadData();
    } else {
        console.log('[INFO] Arquivo ZIP já encontrado. Pulando download...');
    }
    
    console.log('[INFO] Iniciando extração...');
    await extractData();
    console.log('[INFO] Tudo pronto! Agora você pode rodar "npm run server" no backend.');
})();
