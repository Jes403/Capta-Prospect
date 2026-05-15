import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * CRIVO LDR - Módulo de Validação e Enriquecimento de Leads B2B
 * Missão: Limpeza de base e validação de conectividade.
 */

const EXCLUDED_TERMS = ['franquia', 'unidade', 'matriz', 'filial', 'franchise', 'grupo'];
const HOSTING_KEYWORDS = ['domínio expirado', 'site em construção', 'hostgator', 'godaddy', 'locaweb', 'wix', 'wordpress', 'index of'];
const SECURITY_KEYWORDS = [
  'cftv', 'câmera', 'camera', 'monitoramento', 'alarme', 'segurança eletrônica', 'interfone', 'cerca elétrica', 'controle de acesso',
  'suporte ti', 'helpdesk', 'servicedesk', 'gsti', 'governança ti', 'gestão de ti', 'cybersecurity', 'segurança da informação'
];

export async function validateLead(lead) {
    const results = {
        isValid: false,
        reason: '',
        data: { ...lead, validatedAt: new Date().toISOString() }
    };

    // 1. REGRA DE EXCLUSÃO (FRANQUIAS/MATRIZ)
    const nameLower = (lead.name || '').toLowerCase();
    const siteLower = (lead.site || '').toLowerCase();
    if (EXCLUDED_TERMS.some(term => nameLower.includes(term) || siteLower.includes(term))) {
        results.reason = 'Descartado: Possível Franquia/Matriz';
        return results;
    }

    // 2. MÓDULO DE PING E VALIDAÇÃO HTTP
    if (!lead.site || lead.site === '' || lead.site === 'N/A') {
        results.reason = 'Descartado: Sem Site';
        return results;
    }

    // Normaliza URL
    let targetUrl = lead.site;
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

    try {
        const response = await axios.get(targetUrl, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CaptaProspectBot/1.0' },
            validateStatus: (status) => status === 200 
        });

        const $ = cheerio.load(response.data);
        const htmlText = $('body').text().toLowerCase();

        // 3. FILTRO AVANÇADO (PROVEDORES/INATIVO)
        if (HOSTING_KEYWORDS.some(kw => htmlText.includes(kw))) {
            results.reason = 'Descartado: Site Inativo ou Provedor';
            return results;
        }

        // 4. ENRIQUECIMENTO (E-MAIL CORPORATIVO)
        const domain = new URL(targetUrl).hostname.replace('www.', '');
        const emailRegex = new RegExp(`[a-zA-Z0-9._%+-]+@${domain}`, 'gi');
        const foundEmails = response.data.match(emailRegex) || [];
        
        if (foundEmails.length > 0) {
            results.data.email = foundEmails[0].toLowerCase();
        } else {
            const genericEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
            const allEmails = response.data.match(genericEmailRegex) || [];
            const cleanEmails = allEmails.filter(e => !['gmail.com', 'yahoo.com', 'hotmail.com'].some(g => e.includes(g)));
            if (cleanEmails.length > 0) results.data.email = cleanEmails[0].toLowerCase();
        }

        // 5. MÓDULO GMN (GOOGLE MAPS) - CRITÉRIO DE REPUTAÇÃO
        const reviews = parseInt(lead.avaliacoes || 0);
        const rating = parseFloat(lead.nota || 0);

        // 6. IDENTIFICAÇÃO DE GANCHO (CFTV/SEGURANÇA)
        const hasSecurityHook = SECURITY_KEYWORDS.some(kw => htmlText.includes(kw));
        results.data.security_hook = hasSecurityHook;

        if (reviews < 30 || rating < 4.0) {
            results.reason = `Descartado: Reputação GMN Baixa (${rating}⭐ / ${reviews} revs)`;
            return results;
        }

        results.isValid = true;
        results.data.status_code = 200;
        results.data.site_status = 'Ativo';
        return results;

    } catch (error) {
        results.reason = `Descartado: Erro HTTP/DNS (${error.code || error.response?.status || 'Timeout'})`;
        return results;
    }
}

/**
 * Função Principal de Processamento em Massa (Batch)
 */
export async function processLeadBatch(rawLeads) {
    console.log(`\n[LDR MASTER] Iniciando Crivo em ${rawLeads.length} leads...`);
    const validatedLeads = [];
    const BATCH_SIZE = 5; 

    for (let i = 0; i < rawLeads.length; i += BATCH_SIZE) {
        const batch = rawLeads.slice(i, i + BATCH_SIZE);
        const promises = batch.map(lead => validateLead(lead));
        const batchResults = await Promise.all(promises);

        batchResults.forEach(res => {
            if (res.isValid) {
                validatedLeads.push(res.data);
                console.log(`[✅] VALIDADO: ${res.data.name.padEnd(30)} | Site OK | LinkedIn: ${res.data.linkedin ? 'SIM' : 'NÃO'}`);
            } else {
                console.log(`[❌] ${res.reason.padEnd(40)} | Lead: ${res.data.name}`);
            }
        });
    }

    console.log(`\n[LDR FINISHED] Filtro Final: ${validatedLeads.length} leads aprovados de ${rawLeads.length} brutos.\n`);
    return validatedLeads;
}
