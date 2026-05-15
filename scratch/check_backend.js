import http from 'http';
import { execSync } from 'child_process';

const PORT = 3006;

console.log('--- DIAGNÓSTICO DE BACKEND ---');

// 1. Verificando se a porta está ocupada
try {
    const netstat = execSync(`netstat -ano | findstr :${PORT}`).toString();
    console.log(`[!] Porta ${PORT} está sendo usada:`, netstat);
    const pid = netstat.trim().split(/\s+/).pop();
    console.log(`[!] Tentando encerrar PID: ${pid}`);
    execSync(`taskkill /F /PID ${pid}`);
    console.log(`[✅] PID ${pid} encerrado.`);
} catch (e) {
    console.log(`[✅] Porta ${PORT} parece estar livre.`);
}

// 2. Tentando rodar o servidor brevemente para ver erros
console.log('[🚀] Iniciando servidor para teste de fumaça...');
try {
    // Usamos um spawn para não travar o script
    const { spawn } = await import('child_process');
    const server = spawn('node', ['server/index.js'], { stdio: 'inherit' });
    
    setTimeout(() => {
        console.log('[⏳] Teste de fumaça finalizado após 5s.');
        server.kill();
        process.exit(0);
    }, 5000);
} catch (err) {
    console.error('[❌] Erro ao tentar rodar o servidor:', err.message);
    process.exit(1);
}
