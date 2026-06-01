// Configura JWT_PRIVATE_KEY e cria usuário via API HTTP do Convex
const https = require('https');
const crypto = require('crypto');

const CONVEX_URL = 'https://accurate-tiger-693.convex.cloud';
const DEPLOY_KEY = 'dev:accurate-tiger-693|eyJ2MiI6ImFmZjg5OWQxZDAwMzRlN2Y4ODFkOTVmODI0OWFiMWVlIn0=';

// Gera chave Ed25519 nova
const { privateKey } = crypto.generateKeyPairSync('ed25519');
const JWT_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });

console.log('[KEY] Chave gerada:\n', JWT_PRIVATE_KEY);

async function convexRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, CONVEX_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Convex ${DEPLOY_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch { resolve(responseData); }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function setupAndCreateUser() {
  // 1. Configura a variável de ambiente JWT no Convex
  console.log('\n[1/2] Configurando JWT_PRIVATE_KEY no Convex...');
  const envResult = await convexRequest('/api/deployment/update_environment_variables', {
    changes: [{ name: 'JWT_PRIVATE_KEY', value: JWT_PRIVATE_KEY }]
  });
  console.log('Resultado env:', JSON.stringify(envResult));

  // Aguarda 2 segundos para o Convex processar
  await new Promise(r => setTimeout(r, 2000));

  // 2. Cria o usuário via action do Convex Auth
  console.log('\n[2/2] Criando usuário leirascruz@gmail.com...');
  const userResult = await convexRequest('/api/run/auth/signIn', {
    args: {
      provider: 'password',
      params: {
        email: 'leirascruz@gmail.com',
        password: 'Jesse403',
        flow: 'signUp',
      }
    }
  });
  console.log('Resultado usuário:', JSON.stringify(userResult));

  if (userResult.status === 'success' || userResult.token) {
    console.log('\n✅ SUCESSO! Usuário criado. Você pode fazer login agora!');
  } else {
    console.log('\n[INFO] Resposta do servidor:', userResult);
  }
}

setupAndCreateUser().catch(console.error);
