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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DE CAMINHOS E BANCO ---
const DB_FILE = path.join(__dirname, '../data/receita_federal.db');
const DATA_DIR = path.dirname(DB_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database('leads.db');
const receitaDb = new Database(DB_FILE, { readonly: true });
const GMN_STORAGE_FILE = 'gmn_leads_storage.json';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBuvcH-rQxNilBzhGQ3fevCOHz6mFWR3Vc";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeString(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

// Inicialização do Banco e Storage
let GMN_STORE = { leads: [], lastUpdated: null };
if (fs.existsSync(GMN_STORAGE_FILE)) {
  try { GMN_STORE = JSON.parse(fs.readFileSync(GMN_STORAGE_FILE, 'utf-8')); } catch (e) {}
}

function saveGmnStore() {
  GMN_STORE.lastUpdated = new Date().toISOString();
  fs.writeFileSync(GMN_STORAGE_FILE, JSON.stringify(GMN_STORE, null, 2));
}

db.exec(`CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, name TEXT, phone TEXT, email TEXT, status TEXT)`);

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

const JOBS = {};

// Helper para Qualificação via Gemini (v1beta + gemini-2.5-flash — IDÊNTICO AO CRIVOGO)
async function askGemini(prompt, apiKey = null, retries = 3) {
  let activeKey = (apiKey || GEMINI_API_KEY || "").trim();
  if (!activeKey) { console.error("[GEMINI] Chave vazia!"); return null; }
  
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
      console.log(`[GEMINI] Chamando gemini-2.5-flash (tentativa ${i+1}/${retries})...`);
      
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
      }, { timeout: 30000 });
      
      let text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      console.log(`[GEMINI] ✅ Resposta recebida com sucesso.`);
      return JSON.parse(text);
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.error?.message || e.message;
      console.error(`[GEMINI ERROR] Status: ${status} | Detalhe: ${detail}`);
      
      if (status === 429) {
        console.log(`[GEMINI] Rate limit. Aguardando 5s antes de retry...`);
        await sleep(5000);
      } else {
        return null;
      }
    }
  }
  return null;
}

/**
 * MOTOR DE QUALIFICAÇÃO PROFUNDA (SNIPER REAL)
 */
async function deepMineLead(lead) {
  let site = lead.site || "";
  let instagram = lead.instagram || "";
  let email = lead.email || "";
  let socio = lead.socio || "";
  let linkedin = "";

  console.log(`[🛰️ SNIPER] Iniciando Mineração Profunda via Navegador: ${lead.name}...`);

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Pesquisa no Google para achar Site e LinkedIn
    if (!site || site.length < 5) {
      const q = encodeURIComponent(`"${lead.name}" ${lead.loc || ''} site oficial linkedin instagram`);
      await page.goto(`https://www.google.com/search?q=${q}`, { waitUntil: 'networkidle2' });
      
      const searchResults = await page.evaluate(() => {
        const results = { site: "", linkedin: "", instagram: "" };
        document.querySelectorAll('a').forEach(a => {
          const href = a.href;
          if (!results.site && href.includes('.') && !href.includes('google') && !href.includes('facebook') && !href.includes('instagram') && !href.includes('linkedin')) {
            results.site = href;
          }
          if (!results.linkedin && href.includes('linkedin.com/company')) {
            results.linkedin = href;
          }
          if (!results.instagram && href.includes('instagram.com/')) {
            results.instagram = href;
          }
        });
        return results;
      });

      if (searchResults.site) site = searchResults.site;
      if (searchResults.linkedin) linkedin = searchResults.linkedin;
      if (searchResults.instagram) instagram = searchResults.instagram;
    }

    // 2. Se achou site, entra para extrair e-mail e confirmar dados
    if (site && !site.includes('google.com')) {
      await page.goto(site, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      const pageData = await page.evaluate(() => {
        const text = document.body.innerText;
        const html = document.body.innerHTML;
        const emails = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
        const instaLinks = html.match(/instagram\.com\/([^/&? "']+)/gi) || [];
        return { text: text.substring(0, 5000), email: emails[0] || "", insta: instaLinks[0] ? `https://${instaLinks[0]}` : "" };
      });

      if (pageData.email) email = pageData.email;
      if (!instagram && pageData.insta) instagram = pageData.insta;

      // 3. IA para validar e extrair o Sócio
      const prompt = `Analise os dados extraídos da empresa "${lead.name}":
SITE: ${site}
TEXTO: ${pageData.text}
Tente encontrar: 1. Nome do Sócio/Dono, 2. E-mail comercial, 3. Instagram.
Retorne APENAS JSON: {"socio": "nome", "email": "email", "instagram": "url"}`;

      const aiRes = await askGemini(prompt);
      if (aiRes) {
        socio = aiRes.socio || socio;
        email = aiRes.email || email;
        instagram = aiRes.instagram || instagram;
      }
    }

    await browser.close();
  } catch (e) {
    console.error(`[❌ ERROR SNIPER] ${lead.name}:`, e.message);
    if (browser) await browser.close();
  }

  return { ...lead, site, instagram, email, socio, linkedin, qualificado: true };
}

// --- ROTAS GOOGLE MAPS (SNIPER v6.5) ---
app.post('/api/maps/scan', async (req, res) => {
  const { keyword, location, prohibited, apiKey } = req.body;
  const jobId = `maps_${Date.now()}`;
  JOBS[jobId] = { status: 'running', processed: 0, total: 0, results: [], logs: [] };
  res.json({ jobId });

  (async () => {
    const job = JOBS[jobId];
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      const url = `https://www.google.com.br/maps/search/${encodeURIComponent(keyword + ' ' + location)}`;
      await page.goto(url, { waitUntil: 'networkidle2' });

      job.logs.push({ type: 'info', text: `[🛰️] Motor Sniper v6.5 Ativo para: ${keyword}` });

      // Scroll para carregar resultados
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => document.querySelector('div[role="feed"]')?.scrollBy(0, 1000));
        await sleep(1500);
      }

      const extracted = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('div[role="article"]').forEach(el => {
          const name = el.querySelector('div.fontHeadlineSmall')?.innerText;
          const phone = el.querySelector('span.Us7fWe')?.innerText || "";
          const site = el.querySelector('a[data-item-id="authority"]')?.href || "";
          if (name) results.push({ name, phone, site, loc: "" });
        });
        return results;
      });

      job.total = extracted.length;
      job.logs.push({ type: 'success', text: `[🎯] Capturados ${extracted.length} blocos. Qualificando...` });

      for (const lead of extracted) {
        const prompt = `Valide se a empresa "${lead.name}" é do nicho "${keyword}". 
Palavras proibidas: ${prohibited}.
Retorne JSON: {"is_target": true/false, "reason": "..."}`;
        const check = await askGemini(prompt, apiKey);
        if (check?.is_target) {
          job.results.push({ ...lead, status: 'qualificado' });
          job.logs.push({ type: 'success', text: `[💎] APROVADO: ${lead.name}` });
        } else {
          job.logs.push({ type: 'info', text: `[🗑️] TRASH: ${lead.name}` });
        }
        job.processed++;
      }
      job.status = 'idle';
      await browser.close();
    } catch (e) {
      if (browser) await browser.close();
      job.status = 'error';
    }
  })();
});

// --- ROTAS RECEITA FEDERAL (DEEP MINING) ---
app.post('/api/receita/scan', async (req, res) => {
  const { uf, cidade, bairro, cnae } = req.body;
  try {
    const upperCidade = normalizeString(cidade);
    const upperBairro = normalizeString(bairro);
    let sql = "SELECT * FROM estabelecimentos WHERE 1=1";
    const params = [];
    if (uf) { sql += " AND uf = ?"; params.push(uf.toUpperCase()); }
    if (upperCidade) { sql += " AND municipio LIKE ?"; params.push(`%${upperCidade}%`); }
    if (upperBairro) { sql += " AND bairro LIKE ?"; params.push(`%${upperBairro}%`); }
    if (cnae) { sql += " AND cnae LIKE ?"; params.push(`${cnae}%`); }
    
    // FILTRO OBRIGATÓRIO: APENAS EMPRESAS COM NOME FANTASIA
    sql += " AND nome_fantasia IS NOT NULL AND nome_fantasia != ''";
    
    sql += " LIMIT 100";
    
    const rows = receitaDb.prepare(sql).all(...params);
    const leads = rows.map(row => ({
      id: row.id || `rec_${Math.random().toString(36).substr(2, 9)}`,
      name: (row.nome_fantasia || row.razao_social || 'EMPRESA SEM NOME').trim(),
      cnpj: row.cnpj_base || row.cnpj || '',
      loc: `${row.logradouro || ''}, ${row.numero || ''} - ${row.bairro || ''} - ${row.uf || ''}`,
      origin: 'Receita Federal',
      status: 'leads',
      contact: row.tel1 || row.tel2 || row.email || ''
    }));
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/receita/qualify', async (req, res) => {
  const { leads } = req.body;
  const jobId = `qualify_${Date.now()}`;
  JOBS[jobId] = { status: 'running', processed: 0, total: leads.length, results: [], logs: [] };
  res.json({ job_id: jobId });

  (async () => {
    const job = JOBS[jobId];
    for (const lead of leads) {
      try {
        const enriched = await deepMineLead(lead);
        job.results.push(enriched);
        job.processed++;
        job.logs.push({ type: 'success', text: `[🛰️] Enriquecido: ${lead.name}` });
      } catch (e) {
        job.processed++;
        job.logs.push({ type: 'error', text: `[❌] Falha: ${lead.name}` });
      }
    }
    job.status = 'idle';
  })();
});

app.get('/api/hunter/status/:jobId', (req, res) => {
  const job = JOBS[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/health', (req, res) => {
  const leadsCount = db.prepare("SELECT COUNT(*) as count FROM leads").get();
  res.json({ 
    online: true, 
    uptime: process.uptime(),
    db: { count: leadsCount.count }
  });
});

const PORT = 3007;
app.listen(PORT, '0.0.0.0', () => console.log(`[🚀] Backend Capta Command (Original Logic) na porta ${PORT}`));
