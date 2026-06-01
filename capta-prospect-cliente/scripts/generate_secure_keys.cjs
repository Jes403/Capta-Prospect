const crypto = require('crypto');

// Gera um par de chaves RSA de 2048 bits
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8', // O formato que o Convex exige
    format: 'pem'
  }
});

// Remove as quebras de linha e cabeçalhos para o formato que o Convex gosta (opcional, mas pem puro funciona)
console.log('--- COPIE AS LINHAS ABAIXO PARA O SEU CONVEX DASHBOARD OU ENV ---');
console.log('\nCONVEX_AUTH_PRIVATE_KEY:');
console.log(privateKey);

console.log('\nCONVEX_AUTH_ADAPTER_SECRET (Use esta string aleatória):');
console.log(crypto.randomBytes(32).toString('base64'));

console.log('\n-----------------------------------------------------------');
