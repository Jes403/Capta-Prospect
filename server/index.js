import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
try {
  dotenv.config();
} catch (e) {
  console.log("⚠️ Dotenv não carregado, usando variáveis de ambiente do sistema.");
}
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

import { createClient } from '@libsql/client';
import { processLeadBatch } from '../scripts/ldr_validator.js';
import { conectarWhatsApp, getStatus, dispararCampanha, verificarNumero, enviarMensagem, getConversations, getMessages } from './whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3007;

// --- CONFIGURAÇÃO DE CAMINHOS E BANCO ---
const DB_FILE = path.join(__dirname, '../data/receita_federal.db');
const DATA_DIR = path.dirname(DB_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const db = new Database(DB_FILE);

// --- DIAGNÓSTICO DE INICIALIZAÇÃO ---
try {
  console.log('--- [🕵️‍♂️] TESTE DE INTEGRIDADE DO BANCO ---');
  const sample = db.prepare("SELECT * FROM estabelecimentos LIMIT 2").all();
  console.log('Conexão SQLite OK. Amostra de dados encontrada:', JSON.stringify(sample, null, 2));
  console.log('--- [✅] FIM DO DIAGNÓSTICO ---');
} catch (e) {
  console.error('--- [❌] ERRO AO LER O BANCO:', e.message);
}

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  const dbStatus = fs.existsSync(DB_FILE) ? 'connected' : 'not_found';
  res.json({ 
    status: 'online', 
    uptime: process.uptime(),
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Alias para compatibilidade com o frontend antigo
app.get('/health', (req, res) => {
  const dbStatus = fs.existsSync(DB_FILE) ? 'connected' : 'not_found';
  res.json({ status: 'online', uptime: process.uptime(), db: dbStatus });
});

app.get('/', (req, res) => res.send('Capta Prospect Engine - Status: OK'));

// Setup multer para Uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// --- CONFIGURAÇÃO TURSO ---
const turso = (process.env.TURSO_URL && process.env.TURSO_TOKEN) ? createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
}) : null;

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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const SECURITY_KEYWORDS = [
  'cftv', 'câmera', 'camera', 'monitoramento', 'alarme', 'segurança eletrônica', 'interfone', 'cerca elétrica', 'controle de acesso',
  'suporte ti', 'helpdesk', 'servicedesk', 'gsti', 'governança ti', 'gestão de ti', 'cybersecurity', 'segurança da informação'
];

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
  try {
    fs.writeFileSync(GMN_LEADS_FILE, JSON.stringify(GMN_LEADS_STORE, null, 2));
  } catch (e) {
    console.error('[GMN STORE] Erro ao salvar:', e.message);
  }
}

async function searchSocialCandidates(companyName, city, job) {
  const query = `${companyName} ${city} instagram linkedin oficial`;
  return await searchWebCandidates(query, job);
}

async function askGemini(siteText, rules, url, retries = 5, apiKey = null) {
  const prompt = `Você é um Analista de Inteligência Comercial Sênior especializado no modelo NSTI (Núcleo do Suporte).
  Sua missão é qualificar a empresa através do conteúdo do site: ${url}
  
  CONTEÚDO DO SITE PARA ANÁLISE:
  ---
  ${siteText.substring(0, 10000)}
  ---

  FOCO DA EMPRESA (NSTI):
  - Governança de TI (GSTI), Suporte Técnico (Help Desk/Service Desk), Segurança Cibernética e CFTV/Segurança Eletrônica.
  
  REGRAS DE OURO:
  1. Identifique se a empresa é B2B (Empresas de médio/grande porte são leads de ouro).
  2. Procure por nomes de Sócios ou Diretores no "Sobre nós", "Equipe" ou "Contato".
  3. Identifique o Instagram e E-mail Corporativo de contato comercial.
  4. ANALISE SE O SITE JÁ OFERECE ou possui:
     - Se o site já oferece TI ou Segurança -> Marque como "security_hook": true (Concorrente).
     - Se o site é de uma empresa (Ex: Clínica, Advocacia, Indústria) e NÃO fala de TI/Segurança -> Marque como "security_hook": false (Oportunidade de Prospecção).
  
  Retorne EXATAMENTE ESTE JSON:
  {
    "is_valid": true,
    "Nome Empresa": "NOME COMERCIAL DA EMPRESA",
    "E-mail": "EMAIL ENCONTRADO",
    "Instagram": "LINK DO INSTAGRAM",
    "Telefone 2": "OUTROS NUMEROS",
    "security_hook": true ou false,
    "socio": "NOME DO SÓCIO ENCONTRADO"
  }`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const activeKey = apiKey || GEMINI_API_KEY; // Usa a do usuário ou a padrão
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
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

function normalizeString(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

/**
 * BUSCA PROATIVA NO GOOGLE
 * Tenta encontrar o site oficial da empresa se não estiver na base.
 */
async function searchWebCandidates(query, job) {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // Tentativa 1: DuckDuckGo
    await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    let candidates = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[data-testid="result-title-a"]'));
      const blacklist = ['econodata', 'casadosdados', 'cnpj.biz', 'linkedin.com/jobs', 'facebook.com', 'youtube.com', 'google.com', 'cnpj.rocks', 'transparencia.cc'];
      
      return links.slice(0, 5).map(link => ({
        title: link.innerText,
        link: link.href
      })).filter(c => !blacklist.some(b => c.link.toLowerCase().includes(b)));
    });

    // Tentativa 2: Google se DuckDuckGo falhar
    if (candidates.length === 0) {
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });
      candidates = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('div.g'));
        const blacklist = ['econodata', 'casadosdados', 'cnpj.biz', 'linkedin.com/jobs', 'facebook.com', 'youtube.com', 'google.com'];
        
        return links.slice(0, 5).map(el => {
          const a = el.querySelector('a');
          const h3 = el.querySelector('h3');
          return {
            title: h3 ? h3.innerText : '',
            link: a ? a.href : ''
          };
        }).filter(c => c.link && !blacklist.some(b => c.link.toLowerCase().includes(b)));
      });
    }

    return candidates;
  } catch (e) {
    if (job) job.logs.push({ type: 'error', text: `[🌐] Falha na busca de candidatos: ${e.message}` });
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

async function selectBestLinkWithAI(candidates, companyName, city, apiKey = null) {
  if (!candidates || candidates.length === 0) return null;
  
  const prompt = `Analise os seguintes resultados de busca para a empresa "${companyName}" localizada em "${city}".
  Identifique qual destes links é o SITE OFICIAL da empresa.
  
  CANDIDATOS:
  ${candidates.map((c, i) => `${i+1}. Título: ${c.title} | Link: ${c.link}`).join('\n')}
  
  REGRAS:
  - Priorize sites que contenham o nome da empresa no domínio ou título.
  - Se nenhum parecer ser o site oficial (ex: apenas redes sociais ou sites de CNPJ), retorne "null".
  - Retorne APENAS o link escolhido ou a palavra "null".`;

  try {
    const activeKey = apiKey || GEMINI_API_KEY;
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
      contents: [{ parts: [{ text: prompt }] }]
    }, { timeout: 15000 });
    
    const result = response.data.candidates[0].content.parts[0].text.trim();
    return result === "null" ? null : result;
  } catch (e) {
    return candidates[0].link; // Fallback para o primeiro se a IA falhar
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

    console.log(`[🔍] Iniciando mineração via URL DIRETA:`, filters);
    
    // Monta a URL de busca direta para evitar bloqueios de interação
    const baseUrl = 'https://casadosdados.com.br/solucoes/cnpj/pesquisa-avancada/resultado';
    const params = new URLSearchParams();
    if (filters.cnae) params.append('cnae', filters.cnae);
    if (filters.uf) params.append('uf', filters.uf);
    if (filters.municipio) params.append('municipio', filters.municipio.toUpperCase());
    
    const searchUrl = `${baseUrl}?${params.toString()}`;
    console.log(`[🛰️] Acessando: ${searchUrl}`);

    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // Espera o seletor principal ou um sinal de que não há resultados
    try {
      await page.waitForSelector('.box', { timeout: 15000 });
    } catch (e) {
      console.log("[⚠️] Timeout aguardando resultados ou página bloqueada.");
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
 * MOTOR DE QUALIFICAÇÃO OFICIAL (CAPTA - MODO INVESTIGADOR)
 */
async function qualifyLead(lead, job, apiKey = null) {
  let site = lead.site || lead["Site"] || "";
  let instagram = lead.instagram || lead["Instagram"] || "";
  let linkedin = lead.linkedin || lead["LinkedIn"] || "";
  let email = lead.email || lead["E-mail"] || "";
  let socio = lead.socio || "";
  let security_hook = false;
  let status_site = "n/a";
  let siteText = "";

  const empresa = (lead.name || lead["Nome Empresa"] || "").toUpperCase();
  const localizacao = lead.loc || lead["Localização"] || lead.city || "";

  // 1. BUSCA DE SITE (Se não existir)
  if (!site || site.length < 5) {
    job.logs.push({ type: 'info', text: `[🕵️‍♂️] Investigador: Buscando site oficial de "${empresa}"...` });
    const candidates = await searchWebCandidates(`${empresa} ${localizacao} site oficial`, job);
    site = await selectBestLinkWithAI(candidates, empresa, localizacao, apiKey);
  }

  // 2. EXTRAÇÃO PROFUNDA (Se site existir)
  if (site && site.length > 5) {
    job.logs.push({ type: 'info', text: `[🌐] Acessando site: ${site}...` });
    try {
      const url = site.startsWith("http") ? site : `https://${site}`;
      const res = await axios.get(url, { 
        timeout: 10000, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        validateStatus: false
      });
      
      if (res.status >= 200 && res.status < 400) {
        const $ = load(res.data);
        siteText = $('body').text().substring(0, 15000); 
        status_site = "online";

        // Busca links internos (Sobre/Contato) para aprofundar
        const subpages = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && (href.includes('sobre') || href.includes('contato') || href.includes('quem-somos'))) {
            try { subpages.push(new URL(href, url).href); } catch (e) {}
          }
        });

        if (subpages.length > 0) {
          for (const sub of subpages.slice(0, 2)) {
            try {
              const subRes = await axios.get(sub, { timeout: 5000 });
              siteText += "\n" + load(subRes.data)('body').text().substring(0, 5000);
            } catch (e) {}
          }
        }

        // IA: ANÁLISE FORENSE DO SITE (FOCO NO RESPONSÁVEL)
        job.logs.push({ type: 'info', text: `[🧠] Gemini analisando dados de decisão...` });
        const promptIA = `
          Identifique os dados de prospecção para "${empresa}":
          1. Nome do Responsável (Sócio/Dono/Diretor).
          2. E-mail comercial ou direto.
          3. Perfil oficial do Instagram.
          4. Perfil oficial do LinkedIn.
          5. Hook de Segurança: Menciona segurança, CFTV ou TI? (true/false)
          
          Responda APENAS em JSON:
          { "socio": "Nome", "email": "email", "instagram": "url", "linkedin": "url", "security_hook": boolean }
        `;

        const aiRes = await askGemini(siteText, promptIA, site, 1, apiKey);
        if (aiRes) {
          if (aiRes.email) email = aiRes.email;
          if (aiRes.instagram) instagram = aiRes.instagram;
          if (aiRes.socio) socio = aiRes.socio;
          if (aiRes.linkedin) linkedin = aiRes.linkedin;
          if (aiRes.security_hook !== undefined) security_hook = aiRes.security_hook;
        }
      }
    } catch (e) {
      job.logs.push({ type: 'warning', text: `[⚠️] Erro no site. Tentando Varredura Social...` });
      status_site = "offline";
    }
  }

  // 3. VARREDURA SOCIAL PROATIVA (Se faltar dados críticos)
  if (!linkedin || !socio || !instagram) {
    try {
      job.logs.push({ type: 'info', text: `[🔍] Varredura Social: Buscando LinkedIn e Sócios...` });
      const socialCandidates = await searchSocialCandidates(empresa, localizacao, job);
      
      if (!instagram) instagram = socialCandidates.find(c => c.link.includes('instagram.com/'))?.link || "";
      if (!linkedin) linkedin = socialCandidates.find(c => c.link.includes('linkedin.com/'))?.link || "";

      if (!socio) {
        const socioSearch = await searchWebCandidates(`quem é o dono da empresa ${empresa} ${localizacao}`, job);
        const socioAnalysis = await askGemini(JSON.stringify(socioSearch), "Identifique o nome do provável sócio. Retorne apenas o nome.", "", 1, apiKey);
        if (socioAnalysis && socioAnalysis.socio) socio = socioAnalysis.socio;
      }
    } catch (e) {}
  }

  return { 
    ...lead, 
    name: empresa,
    site, 
    instagram, 
    email,
    linkedin: linkedin || "",
    socio: socio || "Investigar LinkedIn",
    contact: lead.contact || lead["Telefone 1"] || "",
    status_site,
    security_hook,
    qualified: true,
    qualificado: true 
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
    cnaes: ['8630', '8640'],
    label: 'Saúde e Clínicas'
  },
  'EDUCACAO': {
    cnaes: ['8513', '8520'],
    label: 'Educação e Escolas'
  },
  'ESCRITORIOS': {
    cnaes: ['6911', '6920', '7112'],
    label: 'Escritórios Estruturados'
  },
  'ENGENHARIA': {
    cnaes: ['7112'],
    label: 'Engenharia e Arquitetura'
  }
};

// GET /api/receita/count — retorna total de registros para os filtros (sem trazer dados)
app.post('/api/receita/count', (req, res) => {
  const { uf, cidade, bairro, cnae, segmento } = req.body;
  try {
    const upperCidade = normalizeString(cidade);
    const upperBairro = normalizeString(bairro);
    const upperSegmento = normalizeString(segmento);
    const cityCode = SIAFI_CITIES[upperCidade] || null;
    let sql = "SELECT COUNT(*) as total FROM estabelecimentos WHERE 1=1";
    const params = [];
    if (uf) { sql += " AND uf = ?"; params.push(uf.toUpperCase()); }
    if (cityCode) { sql += " AND municipio = ?"; params.push(cityCode); }
    else if (upperCidade) { sql += " AND municipio LIKE ?"; params.push(`%${upperCidade}%`); }
    if (upperBairro) { sql += " AND bairro LIKE ?"; params.push(`%${upperBairro}%`); }
    if (cnae) { sql += " AND cnae LIKE ?"; params.push(`${cnae}%`); }
    if (upperSegmento) { sql += " AND (nome_fantasia LIKE ? OR logradouro LIKE ?)"; params.push(`%${upperSegmento}%`, `%${upperSegmento}%`); }
    const row = db.prepare(sql).get(...params);
    res.json({ total: row?.total || 0 });
  } catch (e) { res.json({ total: 0 }); }
});

app.post('/api/receita/scan', async (req, res) => {
  const { uf, cidade, bairro, cnae, segmento, limit: reqLimit, offset: reqOffset } = req.body;
  const scanLimit = Math.min(parseInt(reqLimit) || 100, 500); // máx 500
  const scanOffset = parseInt(reqOffset) || 0;
  try {
    const upperCidade = normalizeString(cidade);
    const upperBairro = normalizeString(bairro);
    const upperSegmento = normalizeString(segmento);
    const cityCode = SIAFI_CITIES[upperCidade] || null;

    let leads = [];

    // --- MOTOR 100% LOCAL (ARQUIVO DE 11M LEADS) ---
    if (fs.existsSync(DB_FILE)) {
      try {
        console.log(`[🗄️] Buscando na base local: ${upperCidade || 'Geral'} (limit=${scanLimit}, offset=${scanOffset})...`);

        let localSql = "SELECT * FROM estabelecimentos WHERE 1=1";
        const localParams = [];

        if (uf) { localSql += " AND uf = ?"; localParams.push(uf.toUpperCase()); }

        if (cityCode) {
            localSql += " AND municipio = ?";
            localParams.push(cityCode);
        } else if (upperCidade) {
            localSql += " AND municipio LIKE ?";
            localParams.push(`%${upperCidade}%`);
        }

        if (upperBairro) { localSql += " AND bairro LIKE ?"; localParams.push(`%${upperBairro}%`); }
        if (cnae) { localSql += " AND cnae LIKE ?"; localParams.push(`${cnae}%`); }

        if (upperSegmento) {
            localSql += " AND (nome_fantasia LIKE ? OR logradouro LIKE ?)";
            localParams.push(`%${upperSegmento}%`, `%${upperSegmento}%`);
        }

        localSql += ` ORDER BY id LIMIT ${scanLimit} OFFSET ${scanOffset}`;
        
        const localResult = db.prepare(localSql).all(...localParams);
        
        leads = localResult.map(row => {
            let socio = '';
            try {
               // Conexão entre estabelecimentos (cnpj_base) e socios (cnpj_basico)
               const socioRow = db.prepare("SELECT nome_socio FROM socios WHERE cnpj_basico = ? LIMIT 1").get(row.cnpj_base);
               if (socioRow) socio = socioRow.nome_socio;
            } catch (e) {}

            return {
                id: row.id || `rec_${Math.random().toString(36).substr(2, 9)}`,
                name: row.nome_fantasia || 'EMPRESA SEM NOME',
                cnpj: row.cnpj_base || '',
                socio: socio,
                loc: `${row.logradouro || ''}, ${row.numero || ''} - ${row.uf}`,
                origin: 'Receita (Arquivo Local)',
                status: 'new',
                contact: row.tel1 || row.tel2 || row.email || ''
            };
        });
        console.log(`[🗄️] Sucesso! ${leads.length} registros encontrados no SQLite.`);

        /* APLICAÇÃO DO CRIVO LDR AUTOMÁTICO (Desativado no Scan Inicial para não sumir com leads sem site)
        console.log(`[🛡️] Ativando Crivo LDR para validar sites e reputação...`);
        const validatedLeads = await processLeadBatch(leads);
        leads = validatedLeads;
        */
        console.log(`[🏆] Busca concluída! ${leads.length} leads encontrados no SQLite.`);
      } catch (localErr) {
        console.error("[🗄️❌] Erro no seu arquivo SQLite:", localErr.message);
      }
    }

    res.json({ leads });
  } catch (err) {
    console.error("[❌] Erro crítico no motor:", err);
    res.status(500).json({ error: err.message });
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

    const BATCH_SIZE = 2; // Reduzido para evitar bloqueios de IP e sobrecarga
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (lead) => {
        if (!lead || !lead.name) {
          job.processed++;
          return;
        }
        try {
          job.logs.push({ type: 'info', text: `[🔍] Analisando: ${lead.name}...` });
          const qualified = await qualifyLead(lead, job);
          if (qualified.site && qualified.site.length > 5) {
            job.results.push(qualified);
            job.logs.push({ type: 'success', text: `[✅] ${lead.name} — site encontrado, qualificado.` });
          } else {
            job.logs.push({ type: 'warning', text: `[🚫] ${lead.name} — nenhum site encontrado, descartado.` });
          }
        } catch (e) {
          job.logs.push({ type: 'warning', text: `[⚠️] Enriquecimento falhou para ${lead.name} — descartado.` });
        } finally {
          job.processed++;
        }
      }));
      // Pausa entre lotes para evitar rate limiting do DuckDuckGo/Google
      if (i + BATCH_SIZE < leads.length) await sleep(3000);
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

          const enriched = sanitizeLeadLinks(await qualifyLead(leadBase, job));
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

// --- NOVO MOTOR DE INJEÇÃO (BOOKMARKLET) ---
app.post('/api/gmn/inject', async (req, res) => {
  const { leads, apiKey } = req.body;
  if (!leads || !Array.isArray(leads)) return res.status(400).json({ error: "Leads array required" });

  const jobId = `inject_${Date.now()}`;
  JOBS[jobId] = { type: 'gmn', status: 'processing', total: leads.length, processed: 0, results: [], logs: [] };
  
  res.json({ job_id: jobId, message: 'Injeção recebida! Iniciando qualificação...' });

  (async () => {
    const job = JOBS[jobId];
    job.logs.push({ type: 'info', text: `[📥] Recebidos ${leads.length} leads via Injetor.` });

    for (const raw of leads) {
      try {
        job.logs.push({ type: 'info', text: `[🔍] Qualificando: ${raw.name}...` });
        
        const leadBase = {
          "Nome Empresa": String(raw.name || "EMPRESA DESCONHECIDA").toUpperCase(),
          "Telefone 1": String(raw.phone || "").replace(/[^\d]/g, ''),
          "Site": raw.site || "",
          "Google Maps": raw.link || "",
          "Endereço": raw.address || "",
          "Nota": String(raw.rating || "0"),
          "Avaliações": String(raw.reviews || "0"),
          origin: 'Maps (Injetor)'
        };

        const enriched = await qualifyLead(leadBase, job, apiKey);
        
        // Evitar duplicatas na store global
        const exists = GMN_LEADS_STORE.leads.some(l => l["Google Maps"] === enriched["Google Maps"]);
        if (!exists) {
          GMN_LEADS_STORE.leads.unshift(enriched); // Adiciona no topo
          saveGmnLeads();
        }

        job.results.push(enriched);
        job.processed++;
      } catch (e) {
        console.error("Erro qualify inject:", e);
        job.processed++;
      }
    }

    job.status = 'idle';
    job.logs.push({ type: 'success', text: `[🏆] Injeção concluída com sucesso!` });
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
        const enriched = sanitizeLeadLinks(await qualifyLead(lead, job));
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

// ── Sanitização de links GMN (aditivo, não toca qualifyLead) ──────────────
function sanitizeLeadLinks(lead) {
  const site = (lead["Site"] || lead.site || "").trim();

  // Se o campo "Site" é na verdade um Instagram
  if (site && site.includes('instagram.com')) {
    lead["Instagram"] = lead["Instagram"] || site;
    lead["Site"] = "";
    lead.site = "";
  }
  // Se o campo "Site" é na verdade um LinkedIn
  if (site && site.includes('linkedin.com')) {
    lead["LinkedIn"] = lead["LinkedIn"] || site;
    lead["Site"] = "";
    lead.site = "";
  }

  // Normalizar campos para formato Capta
  lead.site = lead["Site"] || lead.site || "";
  lead.instagram = lead["Instagram"] || lead.instagram || "";
  lead.linkedin = lead["LinkedIn"] || lead.linkedin || "";
  return lead;
}
// ── FIM sanitização ────────────────────────────────────────────────────────

app.get('/api/hunter/gmn_leads', (req, res) => {
  res.json(GMN_LEADS_STORE);
});

app.delete('/api/hunter/gmn_leads', (req, res) => {
  GMN_LEADS_STORE.leads = [];
  saveGmnLeads();
  res.json({ success: true });
});

// --- MOTOR DE DISPAROS WHATSAPP (BAILEYS — SEM BROWSER, 100% LOCAL) ---

// Retorna o status da conexão no padrão unificado compatível com o frontend
app.get('/api/whatsapp/status', (req, res) => {
  const status = getStatus();
  res.json({
    state: status.connected ? 'open' : status.hasQR ? 'connecting' : 'close',
    connected: status.connected,
    label: status.connected ? 'Conectado e Ativo' : status.hasQR ? 'Aguardando Leitura de QR no Terminal...' : 'Desconectado',
    qr: status.qr
  });
});

// Retorna o QR Code ativo se houver (para fins de compatibilidade)
app.get('/api/whatsapp/qr', (req, res) => {
  const status = getStatus();
  res.json({
    qrCode: status.qr,
    connected: status.connected,
    hasQR: status.hasQR
  });
});

// Inicia os disparos em segundo plano
app.post('/api/whatsapp/send', async (req, res) => {
  const { leads, messageTemplate } = req.body;
  if (!leads || !Array.isArray(leads)) return res.status(400).json({ error: 'Leads obrigatórios' });

  const { connected } = getStatus();
  if (!connected) {
    return res.status(400).json({
      error: 'WhatsApp não está conectado. Conecte no terminal do backend antes de disparar.'
    });
  }

  const jobId = `wa_${Date.now()}`;
  JOBS[jobId] = { type: 'whatsapp', status: 'running', total: leads.length, processed: 0, logs: [] };
  res.json({ job_id: jobId, message: 'Sequência de disparos iniciada!' });

  // Roda em segundo plano sem travar o servidor
  dispararCampanha(leads, messageTemplate || 'Olá [NOME]!', jobId, JOBS);
});

// Cancela uma campanha em andamento
app.post('/api/whatsapp/cancel/:jobId', (req, res) => {
  const job = JOBS[req.params.jobId];
  if (job) {
    job.status = 'cancelled';
    job.logs.push({ type: 'info', text: '[⛔] Campanha cancelada pelo usuário.' });
  }
  res.json({ success: true });
});

// Validação individual anti-spam local usando o método onWhatsApp do Baileys
app.post('/api/whatsapp/check-number', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefone não informado.' });

  try {
    const result = await verificarNumero(phone);
    res.json(result);
  } catch (e) {
    res.status(503).json({ error: 'WhatsApp não está conectado ou falha local.', exists: false });
  }
});

// Envio de mensagem individual para Abordagem Rápida na ficha do lead
app.post('/api/whatsapp/send-single', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });

  try {
    await enviarMensagem(phone, message);
    res.json({ success: true, phone });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Caixa de Entrada — lista de conversas
app.get('/api/whatsapp/conversations', (req, res) => {
  res.json(getConversations());
});

// Caixa de Entrada — mensagens de uma conversa
app.get('/api/whatsapp/messages/:jid', (req, res) => {
  res.json(getMessages(decodeURIComponent(req.params.jid)));
});

// --- FIM — MOTOR DE DISPAROS WHATSAPP (BAILEYS) ---

// Serve o frontend compilado (pasta dist/) — usado na distribuição para clientes
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CAPTA-NC] Backend Master rodando na porta ${PORT}`);

    // Inicia conexão com o WhatsApp automaticamente
    console.log('[📱 WA] Iniciando conexão com o WhatsApp (Baileys)...');
    conectarWhatsApp().catch(err => {
      console.error('[📱 WA] Erro ao iniciar WhatsApp:', err.message);
    });
  });
  
  server.on('error', (err) => {
    console.error('[💥] ERRO NO SERVIDOR HTTP:', err);
  });
} catch (e) {
  console.error('[💥] FALHA CRÍTICA AO INICIAR SERVIDOR:', e);
}

