import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import axios from 'axios';
import * as cheerio from 'cheerio';

const INPUT_FILE = 'C:\\\\Users\\\\leira\\\\projetos profissionais\\\\CrivoGO\\\\Qualificacao_Linkedin.xlsx';
const OUTPUT_FILE = 'C:\\\\Users\\\\leira\\\\projetos profissionais\\\\CrivoGO\\\\Qualificacao_Linkedin_Atualizado.xlsx';

const extractPhones = (text) => {
    const phoneRegex = /(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))/g;
    const matches = text.match(phoneRegex);
    if (!matches) return [];
    
    const unique = [...new Set(matches.map(p => p.trim()))];
    return unique.filter(p => p.replace(/\D/g, '').length >= 10);
};

const extractEmails = (text) => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = text.match(emailRegex);
    if (!matches) return [];
    
    const unique = [...new Set(matches.map(e => e.toLowerCase()))];
    return unique.filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.jpeg') && !e.endsWith('.webp') && !e.endsWith('.gif') && !e.endsWith('.svg'));
};

const extractGmaps = (html) => {
    const gmapsRegex = /https:\/\/(?:www\.)?google\.com\/maps[^\s"']+|https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+/gi;
    const matches = html.match(gmapsRegex);
    return matches ? [...new Set(matches)] : [];
};

async function fetchWithTimeout(url) {
    try {
        const response = await axios.get(url, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            validateStatus: () => true // Resolve on any status code
        });
        return response.data;
    } catch (e) {
        throw new Error(`Axios error: ${e.message}`);
    }
}

async function processRow(row) {
    const needsPhone = !row['Telefone 1'];
    const needsEmail = !row['E-mail'];
    const needsMaps = !row['Google Maps'];

    if (!needsPhone && !needsEmail && !needsMaps) {
        return row; 
    }

    const urlsToTry = [];
    if (row['Site']) {
        let site = row['Site'].toString().trim();
        if (!site.startsWith('http')) site = 'http://' + site;
        urlsToTry.push(site);
    }
    
    if (row['Instagram']) {
        let insta = row['Instagram'].toString().trim();
        if (!insta.startsWith('http')) insta = 'https://' + insta;
        urlsToTry.push(insta);
    }

    if (urlsToTry.length === 0) return row;

    for (const url of urlsToTry) {
        try {
            console.log(`[${row['Empresa']}] Buscando: ${url}`);
            
            const html = await fetchWithTimeout(url);
            if (typeof html !== 'string') continue;

            const $ = cheerio.load(html);
            // remove scripts and styles so we only search visible text
            $('script, style, noscript, svg, img').remove();
            const text = $('body').text();

            if (needsPhone && !row['Telefone 1']) {
                const phones = extractPhones(text);
                if (phones.length > 0) row['Telefone 1'] = phones[0];
                if (phones.length > 1) row['Telefone 2'] = phones[1];
            }

            if (needsEmail && !row['E-mail']) {
                // Also search href="mailto:..."
                const mailtos = [];
                $('a[href^="mailto:"]').each((i, el) => {
                    mailtos.push($(el).attr('href').replace('mailto:', '').split('?')[0]);
                });
                const emails = [...extractEmails(text), ...mailtos];
                const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];
                if (uniqueEmails.length > 0) row['E-mail'] = uniqueEmails[0];
            }

            if (needsMaps && !row['Google Maps']) {
                const maps = extractGmaps(html);
                if (maps.length > 0) row['Google Maps'] = maps[0];
            }

            break;

        } catch (err) {
            console.log(`[${row['Empresa']}] Erro ao acessar ${url}: ${err.message}`);
        }
    }

    return row;
}

async function run() {
    console.log('Lendo planilha...');
    const workbook = xlsx.readFile(INPUT_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    console.log(`Encontradas ${data.length} linhas (incluindo vazias). Processando com Axios...`);
    
    let processedCount = 0;
    
    // Process concurrently in chunks of 10
    const CHUNK_SIZE = 10;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        
        const promises = chunk.map(async (row, index) => {
            if (!row['Empresa'] || row['Empresa'].toString().trim() === '') return;
            console.log(`Processando: ${row['Empresa']}`);
            await processRow(row);
            processedCount++;
        });

        await Promise.all(promises);
    }

    console.log('\\nSalvando planilha atualizada...');
    const newSheet = xlsx.utils.json_to_sheet(data);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
    xlsx.writeFile(newWorkbook, OUTPUT_FILE);

    console.log(`Concluído! ${processedCount} empresas processadas. Arquivo salvo em: ${OUTPUT_FILE}`);
}

run().catch(console.error);
