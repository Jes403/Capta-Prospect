import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import multer from 'multer';
import * as xlsx from 'xlsx';
import axios from 'axios';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, '../data/receita_federal.db');
const DATA_DIR = path.dirname(DB_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
// Setup multer para Uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

const db = new Database(DB_FILE);

const JOBS = {};

// Rota para upload do banco de dados (Apenas para configuração inicial)
app.post('/api/admin/upload-db', upload.single('database'), (req, res) => {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  
  // O banco de dados SQLite precisa ser fechado antes de sobrescrever
  db.close();
  
  const targetPath = DB_FILE;
  fs.renameSync(req.file.path, targetPath);
  
  // Reabrir o banco
  global.db = new Database(DB_FILE);
  
  res.send('Banco de dados atualizado com sucesso!');
});

// Helper para acessar o db globalmente se necessário
global.db = db;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAfw6Dx_zLagO_lQm9CHRwYS3IHb7Rbt_0";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyCJ-RbfpKYkvC-323zdOkdRuM3ysXC0m5c";
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || "apify_api_9RWdIYeKUoDIBlCHyxenAdWhSwgBPj1ULTxQ";

// Storage persistente para Leads do GMN (Maps)
const GMN_LEADS_FILE = path.join(__dirname, '../data/gmn_leads_storage.json');
let GMN_LEADS_STORE = { leads: [], lastUpdated: null };

if (fs.existsSync(GMN_LEADS_FILE)) {
  try {
    GMN_LEADS_STORE = JSON.parse(fs.readFileSync(GMN_LEADS_FILE, 'utf8'));
  } catch (e) {
    console.log('[GMN STORE] ⚠️ Arquivo corrompido ou vazio.');
  }
}

function saveGmnLeads() {
  GMN_LEADS_STORE.lastUpdated = new Date().toISOString();
  fs.writeFileSync(GMN_LEADS_FILE, JSON.stringify(GMN_LEADS_STORE, null, 2));
}

async function askGemini(siteText, rules, url, retries = 5) {
  const prompt = `Você é um Analista de Qualificação de Leads experiente. Sua missão é analisar o site: ${url}
  TEXTO E LINKS DO SITE (RESUMO):
  ${siteText.substring(0, 10000)}
  REGRAS DE QUALIFICAÇÃO:
  "${rules}"
  Retorne EXATAMENTE UM JSON:
  {
    "is_valid": true ou false,
    "Nome Empresa": "NOME EXTRAÍDO",
    "E-mail": "EMAIL COMERCIAL",
    "Instagram": "LINK DO INSTAGRAM",
    "Google Maps": "LINK OU ENDEREÇO",
    "Telefone 2": "APENAS NÚMEROS"
  }`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
      }, { timeout: 30000 });
      return JSON.parse(response.data.candidates[0].content.parts[0].text);
    } catch (e) {
      if (e.response && e.response.status === 429) {
        await new Promise(r => setTimeout(r, 5000));
      } else {
        return null;
      }
    }
  }
  return null;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function formatProperName(str) {
  if (!str) return "";
  const preposicoes = ["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos"];
  return str.trim().toLowerCase().split(' ').map((word, index) => {
    if (word.length === 0) return "";
    if (index > 0 && preposicoes.includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

/**
 * BUSCA PROATIVA NO GOOGLE
 * Tenta encontrar o site oficial da empresa se não estiver na base.
 */
async function discoverSite(companyName, city, job) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const query = `${companyName} ${city} site oficial`;
    
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });
    
    const firstLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('div.g a'));
      const blacklist = ['econodata', 'casadosdados', 'cnpj.biz', 'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com', 'google.com'];
      
      for (const link of links) {
        const href = link.href;
        if (href && href.startsWith('http') && !blacklist.some(b => href.toLowerCase().includes(b))) {
          return href;
        }
      }
      return null;
    });

    return firstLink;
  } catch (e) {
    if (job) job.logs.push({ type: 'error', text: `[🌐] Falha na busca Google: ${e.message}` });
    return null;
  } finally {
    if (browser) await browser.close();
  }
}


/**
 * Mineração Proativa via Casa dos Dados (Web Scraping)
 * Filtra empresas por CNAE, Estado e Cidade em tempo real.
 */
async function mineCasaDosDados(filters) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: "new"
    });
    
    const page = await browser.newPage();
    // User Agent de um Chrome atual no Windows
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    console.log(`[🔍] Iniciando mineração na Casa dos Dados:`, filters);
    
    await page.goto('https://casadosdados.com.br/solucoes/cnpj/pesquisa-avancada', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    if (filters.cnae) {
      const cnaeInput = 'input[placeholder="Atividade Econômica (CNAE)"]';
      await page.waitForSelector(cnaeInput, { timeout: 10000 });
      await page.type(cnaeInput, filters.cnae);
      await new Promise(r => setTimeout(r, 1500));
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 1000));
    }

    if (filters.uf) {
      await page.select('select.input', filters.uf); 
      await new Promise(r => setTimeout(r, 500));
    }

    const searchBtn = await page.$('button.is-success');
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    }

    // Esperar um pouco para os resultados carregarem
    await new Promise(r => setTimeout(r, 3000));

    const leads = await page.evaluate(() => {
      const results = [];
      // Tenta encontrar todos os links que apontam para um CNPJ, que ficam dentro dos cards
      const links = document.querySelectorAll('a[href*="/cnpj/"]');
      
      links.forEach(link => {
        const card = link.closest('.box') || link.closest('.card') || link.parentElement;
        const razaoSocial = link.innerText.trim();
        const textContent = card ? card.innerText : "";
        const cnpjMatch = textContent.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
        
        if (razaoSocial && cnpjMatch) {
          results.push({
            cnpj: cnpjMatch[0].replace(/\D/g, ''),
            razao_social: razaoSocial,
            situacao: 'ATIVA'
          });
        }
      });
      return results;
    });

    console.log(`[🛰️] Captura finalizada. Brutos encontrados: ${leads.length}`);
    return leads;

  } catch (error) {
    console.error(`[❌] Erro na mineração Casa dos Dados:`, error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * MOTOR DE QUALIFICAÇÃO OFICIAL (CAPTA)
 * Segue as regras do instrucoes.txt: Status Site, Nome Comercial (<title>), Instagram e Maps.
 */
async function qualifyLead(lead, job) {
  let site = lead.site || lead["Site"] || "";
  let instagram = lead.instagram || lead["Instagram"] || "";
  let email = lead.email || lead["E-mail"] || "";
  let empresa = lead.name || lead["Nome Empresa"] || "";
  let localizacao = lead.loc || lead["Localização"] || "";
  let status_site = "offline";

  // REGRA: Se não tem site, tenta descobrir no Google
  if (!site || site.length < 5) {
    job.logs.push({ type: 'info', text: `[🌐] Buscando site para ${empresa}...` });
    const discovered = await discoverSite(empresa, localizacao, job);
    if (discovered) {
      site = discovered;
      job.logs.push({ type: 'success', text: `[🔗] Site encontrado: ${site}` });
    }
  }

  if (site && site.length > 4) {
    try {
      const url = site.startsWith("http") ? site : `https://${site}`;
      const agent = new https.Agent({ rejectUnauthorized: false });
      
      const response = await axios.get(url, {
        timeout: 10000,
        httpsAgent: agent,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        maxRedirects: 5,
        validateStatus: false
      });

      if (response.status >= 200 && response.status < 400) {
        status_site = "online";
        const $ = load(response.data);
        
        const pageTitle = $('title').text().split('|')[0].split('-')[0].trim();
        const pageH1 = $('h1').first().text().trim();
        
        if (!empresa || empresa === 'SEM NOME FANTASIA' || empresa.length < 3) {
          const possibleName = (pageH1 && pageH1.length < 40) ? pageH1 : pageTitle;
          if (possibleName && possibleName.length > 3) {
             empresa = possibleName.replace(/\s(LTDA|ME|EIRELI|S\.A\.|LIMITADA|EPP|SITE|OFICIAL|HOME|INÍCIO)\b/gi, '').trim();
          }
        }

        // Busca aprimorada de Instagram
        let instaFound = $('a[href*="instagram.com/"]').first().attr('href') || "";
        if (!instaFound) {
           // Tenta regex no texto bruto
           const match = response.data.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
           if (match) instaFound = `https://www.instagram.com/${match[1]}`;
        }
        if (instaFound) instagram = instaFound;

        let emailFound = $('a[href^="mailto:"]').first().attr('href')?.replace("mailto:", "").split("?")[0].trim() || "";
        if (!emailFound) {
           const match = response.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
           if (match) emailFound = match[0];
        }
        if (emailFound) email = emailFound;

        if (!instagram || !email) {
          const bodyText = $('body').text().replace(/\s+/g, ' ').substring(0, 5000);
          const aiRes = await askGemini(bodyText, "Extraia Instagram e E-mail comercial para prospecção", url, 1);
          if (aiRes) {
            if (!instagram) instagram = aiRes.Instagram || "";
            if (!email) email = aiRes["E-mail"] || "";
          }
        }
      }
    } catch (e) {
      status_site = "offline";
    }
  }

  // REGRA: Gerar link do Google Maps com o nome comercial
  const googleMapsLink = `https://www.google.com/maps/search/${encodeURIComponent(empresa)}`;

  return { 
    ...lead, 
    name: empresa,
    site, 
    instagram, 
    email,
    googleMaps: googleMapsLink,
    status_site,
    qualificado: status_site === "online"
  };
}

// Diagnóstico de Schema no Startup
console.log('--- DIAGNÓSTICO DE BANCO DE DADOS ---');
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  console.log('Tabelas encontradas:', tables.join(', '));
  
  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    console.log(`Colunas em [${table}]:`, columns.join(', '));
  }
} catch (e) {
  console.error('Erro ao ler schema:', e.message);
}
console.log('-----------------------------------');

// Mapping of common Cities to SIAFI codes
const SIAFI_CITIES = {
  'SAO PAULO': '7107',
  'RIO DE JANEIRO': '6001',
  'BELO HORIZONTE': '4123',
  'CURITIBA': '7535',
  'PORTO ALEGRE': '8801',
  'BRASILIA': '9701',
  'SALVADOR': '3849',
  'FORTALEZA': '1389',
  'RECIFE': '2531',
  'MANAUS': '0255',
  'CAMPINAS': '6291',
  'GOIANIA': '9373',
  'BELEM': '0427',
  'SAO LUIS': '0921',
  'MACEIO': '2785',
  'NATAL': '1761',
  'JOAO PESSOA': '2399',
  'TERESINA': '1219',
  'CAMPO GRANDE': '9051',
  'CUIABA': '9067',
  'ARACAJU': '3105',
  'FLORIANOPOLIS': '8105',
  'VITORIA': '5705',
  'SANTOS': '7071',
  'NITEROI': '5865'
};

const NICHE_CONFIG = {
  'SAUDE': {
    cnaes: ['86'],
    label: 'Saúde e Clínicas'
  },
  'EDUCACAO': {
    cnaes: ['85'],
    label: 'Educação e Escolas'
  },
  'ESCRITORIOS': {
    cnaes: ['69', '70'],
    label: 'Escritórios Estruturados'
  },
  'ENGENHARIA': {
    cnaes: ['71'],
    label: 'Engenharia e Arquitetura'
  }
};

app.post('/api/receita/scan', async (req, res) => {
  const { uf, cidade, cnae, segmento, niche, excludeMei = true, ping = false } = req.body;
  
  if (ping) return res.json({ status: 'online' });
  
  try {
    const upperCidade = cidade ? cidade.toUpperCase().trim() : '';
    const siafiCode = SIAFI_CITIES[upperCidade];

    let leads = [];

    // TENTA BUSCAR NO SQLITE (SE EXISTIR)
    if (fs.existsSync(DB_FILE)) {
      try {
        // Detectar tabelas disponíveis
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        const hasEmpresas = tables.includes('empresas') || tables.includes('empresa');
        const tableEmpresas = tables.includes('empresas') ? 'empresas' : 'empresa';
        const hasSocios = tables.includes('socios') || tables.includes('socio');
        const tableSocios = tables.includes('socios') ? 'socios' : 'socio';
        const tableEstab = tables.includes('estabelecimentos') ? 'estabelecimentos' : 'estabelecimento';

        // Detectar colunas de estabelecimento
        const rawEstabCols = db.prepare(`PRAGMA table_info(${tableEstab})`).all();
        const findCol = (cols, targets) => {
          for (const t of targets) {
            const found = cols.find(c => c.name.toLowerCase() === t.toLowerCase() || c.name.toLowerCase().startsWith(t.toLowerCase()));
            if (found) return found.name;
          }
          return cols[0].name;
        };

        const cnpjColEstab = findCol(rawEstabCols, ['cnpj_basico', 'cnpj_base', 'cnpj']);

        let sql = `
          SELECT 
            e.*
            ${hasEmpresas ? `, em.razao_social, em.natureza_juridica, em.porte` : ''}
          FROM ${tableEstab} e 
          ${hasEmpresas ? `LEFT JOIN ${tableEmpresas} em ON e.${cnpjColEstab} = em.cnpj_basico` : ''}
          WHERE 1=1
          LIMIT 50
        `;
        
        leads = db.prepare(sql).all().map(row => ({
            id: row.id || `rec_${Math.random().toString(36).substr(2, 9)}`,
            name: row.nome_fantasia || row.razao_social || 'EMPRESA SEM NOME',
            cnpj: row.cnpj || row.cnpj_basico || '',
            loc: `${row.logradouro || ''}, ${row.numero || ''} - ${row.uf}`,
            origin: 'Receita (Local)',
            status: 'new'
        }));
      } catch (e) {
        console.log("[🗄️] Erro ou Banco vazio, usando robô...");
      }
    }

    // FALLBACK: SE NÃO TEM LEADS NO SQLITE, USA O ROBÔ NA CASA DOS DADOS
    if (leads.length === 0) {
      console.log("[🤖] Ativando Robô Caçador (Casa dos Dados)...");
      const scraped = await mineCasaDosDados({ cnae, uf, municipio: cidade });
      leads = (scraped || []).filter(l => l && l.razao_social).map(l => ({
        ...l,
        name: l.razao_social,
        origin: 'Receita (Robô)',
        status: 'new'
      }));
    }

    res.json({ leads });
  } catch (error) {
    console.error('❌ [ERRO BACKEND]:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- NOVO MOTOR DE QUALIFICAÇÃO PARA LEADS DA RECEITA ---
app.post('/api/receita/qualify', async (req, res) => {
  const { leads } = req.body;
  if (!leads || !Array.isArray(leads)) return res.status(400).json({ error: "Lista de leads necessária" });

  const jobId = `qualify_${Date.now()}`;
  JOBS[jobId] = { type: 'qualify', status: 'processing', total: leads.length, processed: 0, results: [], logs: [] };
  
  res.json({ job_id: jobId, message: 'Qualificação em massa iniciada!' });

  (async () => {
    const job = JOBS[jobId];
    job.logs.push({ type: 'info', text: `[🚀] Iniciando qualificação de ${leads.length} leads da Receita...` });

    for (const lead of leads) {
      if (!lead || !lead.name) {
        job.processed++;
        continue;
      }
      try {
        job.logs.push({ type: 'info', text: `[🔍] Analisando: ${lead.name}...` });
        const qualified = await qualifyLead(lead, job);
        job.results.push(qualified);
        job.processed++;
      } catch (e) {
        job.logs.push({ type: 'error', text: `[❌] Erro em ${lead.name}: ${e.message}` });
        job.processed++;
      }
    }

    job.status = 'idle';
    job.logs.push({ type: 'success', text: `[🏆] Qualificação concluída: ${job.results.filter(r => r.qualificado).length} empresas qualificadas!` });
  })();
});

// --- MOTOR OFICIAL GOOGLE MAPS (API KEY) ---

// --- MOTOR OFICIAL GOOGLE MAPS (API KEY) ---
app.post('/api/hunter/gmn_api', async (req, res) => {
  const { keyword, location, minReviews, minRating } = req.body;
  if (!keyword) return res.status(400).json({ error: "Keyword required" });

  const activeJobId = Date.now().toString();
  JOBS[activeJobId] = { type: 'gmn', status: 'processing', total: 0, processed: 0, results: [], logs: [] };
  res.json({ job_id: activeJobId, message: 'Busca via API Oficial iniciada!' });

  (async () => {
    const job = JOBS[activeJobId];
    try {
      const query = `${keyword} em ${location || ''}`.trim();
      job.logs.push({ type: 'info', text: `[🌐 API] Consultando Google (PRO) para: "${query}"...` });
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;
      const searchRes = await axios.get(searchUrl);
      
      if (searchRes.data.status !== "OK") {
        job.logs.push({ type: 'error', text: `[❌ ERRO GOOGLE] ${searchRes.data.status}` });
        job.status = 'idle';
        return;
      }

      const places = searchRes.data.results || [];
      job.total = places.length;

      for (const place of places) {
        try {
          job.logs.push({ type: 'info', text: `[🔍 ANALISANDO] ${place.name}...` });
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,url&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;
          const detailsRes = await axios.get(detailsUrl);
          const d = detailsRes.data.result || {};

          let leadBase = {
            "Nome Empresa": String(d.name || place.name).toUpperCase(),
            "Telefone 1": String(d.formatted_phone_number || "").replace(/[^\d]/g, ''),
            "Site": d.website || "",
            "Google Maps": d.url || "",
            "Endereço": place.formatted_address || "",
            "Nota": String(d.rating || 0),
            "Avaliações": String(d.user_ratings_total || 0),
            origin: 'Maps'
          };

          const enriched = await qualifyLead(leadBase, job);
          job.results.push(enriched);
          GMN_LEADS_STORE.leads.push(enriched);
          saveGmnLeads();
          job.processed++;
        } catch (e) {
          job.processed++;
        }
      }
      job.status = 'idle';
      job.logs.push({ type: 'success', text: `[🏆 FINALIZADO] ${job.results.length} leads salvos!` });
    } catch (err) {
      job.status = 'error';
    }
  })();
});

app.post('/api/hunter/gmn', async (req, res) => {
  const { keyword, location, minReviews, minRating } = req.body;
  if (!keyword) return res.status(400).json({ error: "Keyword required" });

  const jobId = Date.now().toString();
  JOBS[jobId] = { type: 'gmn', status: 'processing', total: 0, processed: 0, results: [], logs: [] };
  res.json({ job_id: jobId, message: 'Busca robótica iniciada!' });

  (async () => {
    const job = JOBS[jobId];
    let browser;
    try {
      job.logs.push({ type: 'info', text: `[🔍 ROBÔ] Iniciando navegador...` });
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      const query = `${keyword} ${location || ''}`.trim();
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });
      
      job.logs.push({ type: 'info', text: `[🖱️] Rolando a lista...` });
      const extractedLeads = await page.evaluate(async () => {
        const results = [];
        const seen = new Set();
        const feed = document.querySelector('div[role="feed"]') || document.body;
        for (let i = 0; i < 10; i++) {
          feed.scrollBy(0, 1000);
          await new Promise(r => setTimeout(r, 1000));
        }
        document.querySelectorAll('div[role="article"]').forEach(el => {
          const name = el.querySelector('div.fontHeadlineSmall')?.innerText;
          const link = el.querySelector('a')?.href;
          if (name && link && !seen.has(link)) {
            seen.add(link);
            const text = el.innerText || "";
            // Regexes para extrair dados comuns da string do Maps
            const phone = text.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/)?.[0] || "";
            const rating = text.match(/(\d\.\d)\s\(\d+\)/)?.[1] || "";
            const site = el.querySelector('a[aria-label*="website"], a[aria-label*="site"]')?.href || "";
            
            results.push({ 
              name, 
              link, 
              phone, 
              rating, 
              site,
              address: text.split('\n').find(l => l.includes(',') && /\d/.test(l)) || ""
            });
          }
        });
        return results;
      });

      job.logs.push({ type: 'success', text: `[🎯] Capturados ${extractedLeads.length} leads. Qualificando...` });
      await browser.close();

      for (const raw of extractedLeads) {
        const lead = {
          "Nome Empresa": raw.name.toUpperCase(),
          "Google Maps": raw.link,
          "Telefone 1": raw.phone,
          "Endereço": raw.address,
          "Site": raw.site,
          "Nota": raw.rating,
          origin: 'Maps (Robot)'
        };
        const enriched = await qualifyLead(lead, job);
        job.results.push(enriched);
        GMN_LEADS_STORE.leads.push(enriched);
        saveGmnLeads();
        job.processed++;
      }
      job.status = 'idle';
      job.logs.push({ type: 'success', text: `[🏆 FINALIZADO] Robô concluiu a tarefa!` });
    } catch (e) {
      if (browser) await browser.close();
      job.status = 'error';
      job.logs.push({ type: 'error', text: `[❌ ERRO] ${e.message}` });
    }
  })();
});

app.get('/api/hunter/status/:jobId', (req, res) => {
  const job = JOBS[req.params.jobId];
  if (!job) return res.status(404).send("Not found");
  res.json(job);
});

app.get('/api/hunter/gmn_leads', (req, res) => {
  res.json(GMN_LEADS_STORE);
});

app.delete('/api/hunter/gmn_leads', (req, res) => {
  GMN_LEADS_STORE.leads = [];
  saveGmnLeads();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3006;
app.post('/api/mine/casadosdados', async (req, res) => {
  const { cnae, uf, municipio } = req.body;
  try {
    const leads = await mineCasaDosDados({ cnae, uf, municipio });
    res.json({ success: true, leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CAPTA-NC] Backend Master rodando na porta ${PORT}`);
});
