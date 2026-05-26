/**
 * MOTOR DE DISPAROS WHATSAPP — BAILEYS
 * Substitui o Puppeteer por uma conexão WebSocket direta.
 * Funciona 100% local, sem VPS, sem navegador.
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  delay
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_PATH = path.join(__dirname, '../wa_session_baileys');

// Estado global da conexão
let sock = null;
let isConnected = false;
let qrCodeString = null;

/**
 * Inicia e mantém a conexão com o WhatsApp
 */
export async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, console)
    },
    printQRInTerminal: false, // Gerenciamos o QR manualmente
    browser: ['Capta Prospect', 'Chrome', '120.0'],
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });

  // Captura o QR Code para exibir na interface
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeString = qr;
      // Exibe também no terminal para debug
      qrcode.generate(qr, { small: true });
      console.log('[📱 WA] Novo QR Code gerado. Escaneie pelo celular!');
    }

    if (connection === 'open') {
      isConnected = true;
      qrCodeString = null;
      console.log('[✅ WA] WhatsApp conectado com sucesso!');
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
          : true;

      console.log('[⚠️ WA] Conexão encerrada. Reconectando:', shouldReconnect);

      if (shouldReconnect) {
        setTimeout(conectarWhatsApp, 3000);
      } else {
        console.log('[🔴 WA] Sessão encerrada. Delete a pasta wa_session_baileys e reconecte.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
  return sock;
}

/**
 * Retorna o status atual da conexão
 */
export function getStatus() {
  return {
    connected: isConnected,
    hasQR: !!qrCodeString,
    qr: qrCodeString
  };
}

/**
 * Formata o número para o padrão do WhatsApp
 * Aceita: "11999998888", "(11) 99999-8888", "+5511999998888"
 */
function formatarNumero(numero) {
  const limpo = numero.replace(/\D/g, '');
  // Se já tem DDI (55 + DDD + número)
  if (limpo.startsWith('55') && limpo.length >= 12) {
    return `${limpo}@s.whatsapp.net`;
  }
  // Se tem apenas DDD + número (10 ou 11 dígitos)
  if (limpo.length >= 10) {
    return `55${limpo}@s.whatsapp.net`;
  }
  return null;
}

/**
 * Envia UMA mensagem para UM número
 */
export async function enviarMensagem(numero, mensagem) {
  if (!isConnected || !sock) {
    throw new Error('WhatsApp não está conectado. Conecte pelo celular primeiro.');
  }

  const jid = formatarNumero(numero);
  if (!jid) throw new Error(`Número inválido: ${numero}`);

  await sock.sendMessage(jid, { text: mensagem });
  return true;
}

/**
 * Verifica se um número está cadastrado no WhatsApp (Validação Local Anti-Spam)
 */
export async function verificarNumero(numero) {
  if (!isConnected || !sock) {
    throw new Error('WhatsApp não está conectado.');
  }

  const jid = formatarNumero(numero);
  if (!jid) return { exists: false };

  try {
    const [result] = await sock.onWhatsApp(jid);
    return {
      exists: !!result?.exists,
      jid: result?.jid || jid,
      formattedPhone: result?.jid ? result.jid.split('@')[0] : numero
    };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

/**
 * Processa a lista completa de leads com delay humano e pausas anti-bloqueio
 */
export async function dispararCampanha(leads, template, jobId, JOBS) {
  const job = JOBS[jobId];
  if (!job) return;

  job.status = 'running';
  job.total = leads.length;
  job.processed = 0;
  job.logs = [{ type: 'info', text: `[🚀] Iniciando campanha para ${leads.length} contatos...` }];

  let successCount = 0;

  for (const lead of leads) {
    if (job.status === 'cancelled') {
      job.logs.push({ type: 'info', text: '[⛔] Campanha cancelada pelo usuário.' });
      break;
    }

    const numero = lead.contact || lead.tel1 || lead.tel2 || '';
    const nome = lead.name || 'Cliente';
    const mensagem = template.replace(/\[NOME\]/gi, nome);

    if (!numero || numero.length < 8) {
      job.logs.push({ type: 'error', text: `[⚠️] ${nome} — sem número válido, pulando.` });
      job.processed++;
      continue;
    }

    try {
      await enviarMensagem(numero, mensagem);
      job.logs.push({ type: 'success', text: `[✅] Enviado: ${nome} (${numero})` });
      job.processed++;
      successCount++;

      if (job.status === 'cancelled') break;

      // Se completou múltiplo de 10 envios bem-sucedidos, faz uma pausa maior de descanso de 60 segundos
      if (successCount > 0 && successCount % 10 === 0 && job.processed < leads.length) {
        job.logs.push({ type: 'info', text: `[💤] Pausa de descanso anti-bloqueio por 60 segundos...` });
        await delay(60000);
      } else if (job.processed < leads.length) {
        // Delay humanizado dinâmico: entre 15 e 30 segundos
        const delayMs = Math.floor(Math.random() * 15000) + 15000;
        job.logs.push({ type: 'info', text: `[⏳] Aguardando ${(delayMs / 1000).toFixed(0)}s antes do próximo...` });
        await delay(delayMs);
      }

    } catch (err) {
      job.logs.push({ type: 'error', text: `[❌] Falha em ${nome}: ${err.message}` });
      job.processed++;
      // Espera um pouco mais após um erro antes de tentar o próximo
      await delay(8000);
    }
  }

  job.status = 'idle';
  const sucesso = job.logs.filter(l => l.type === 'success').length;
  job.logs.push({
    type: 'success',
    text: `[🏆] Campanha concluída! ${sucesso} de ${leads.length} mensagens enviadas.`
  });
}

