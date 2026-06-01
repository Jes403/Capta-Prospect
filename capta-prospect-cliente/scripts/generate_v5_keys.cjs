const crypto = require('crypto');

// Gera uma chave RSA de 2048 bits no formato PKCS#8
const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Gera um segredo aleatório para o adapter
const adapterSecret = crypto.randomBytes(32).toString('base64');

console.log('--- NOVA CHAVE PRIVADA (PKCS#8) ---');
console.log(privateKey);
console.log('--- NOVO ADAPTER SECRET ---');
console.log(adapterSecret);
console.log('---------------------------');
