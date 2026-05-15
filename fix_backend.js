import http from 'http';
import { execSync } from 'child_process';

const PORT = 3007;

console.log('--- DIAGNÓSTICO DE EMERGÊNCIA ---');

// 1. Limpeza de porta
try {
    const netstat = execSync(`netstat -ano | findstr :${PORT}`).toString();
    console.log(`[!] Porta ${PORT} em uso.`);
    const pid = netstat.trim().split(/\s+/).pop();
    execSync(`taskkill /F /PID ${pid}`);
    console.log(`[✅] Porta ${PORT} liberada (PID ${pid}).`);
} catch (e) {
    console.log(`[✅] Porta ${PORT} está livre.`);
}

console.log('[🚀] Iniciando o servidor agora...');
try {
    execSync('node server/index.js', { stdio: 'inherit' });
} catch (e) {
    console.error('[❌] O servidor parou:', e.message);
}
