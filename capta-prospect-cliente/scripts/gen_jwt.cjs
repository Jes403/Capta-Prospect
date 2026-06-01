// Configura o JWT_PRIVATE_KEY no Convex via API HTTP direta
const https = require('https');
const crypto = require('crypto');

// Gera nova chave Ed25519
const { privateKey } = crypto.generateKeyPairSync('ed25519');
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

console.log('[INFO] Chave PEM gerada:\n', privPem);

// Envia para o Convex via CLI salvo em arquivo temporário
const fs = require('fs');
fs.writeFileSync('jwt_key.txt', privPem);
console.log('[INFO] Chave salva em jwt_key.txt');
console.log('[INFO] Use: npx convex env set JWT_PRIVATE_KEY "$(cat jwt_key.txt)"');
