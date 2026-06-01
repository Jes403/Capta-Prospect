const { execSync } = require('child_process');

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfH0OyfoI3cBnK
uVx5U5EAr6N7UD0jBN/pY5Btad5ooK8putvAGQQEiZ1iy9VWHc1tEokXJtVHViQm
jS07jpzW0tJlWKtAB2jWMHzjiEAUA1+wEBpqLBnaxUzjJVSpI9la9rbvmzJ1YJil
Ex/kOPZRN830kKYlD4mnz1dPQe16ciia4ESh+3aJfrCVFoMbM8soe62WQ7vzd3jO
XdpoY5LW7WbZjhbAZV82AYsYWV/0Kn1aekAxgDh6bOjsWrF7SwB8rpWzS6ORPsAY
dPht/YOJ96Q3ofwv1rR321SCzqUqo8wDPiO2VpV3sKBbXqDoDcyjx021t08fWeuw
9/suLwCrAgMBAAECggEAM2XU5yYIB8I1Ao+HOEVu9ArHwsAzT0l2zhtz/nOQ/LjS
e6c47j7mVlThOpVerrdnsJCpKYpIoAdKHA3EC5XQQW/NuCDBCCici3sUDCbpk81X
Lja1YZAnNcw/PqvDQfMrdT917cVysglmpQOdbImdvrRI2XOTxyrSqxrFN/uyqrcM
YxQXs5E8JWYP80Y46hV3hb7Nm3psVTlXgo5EzFv+bPSUl0E8VfyZ99QUeTNR+12d
iYWEP4pYQHruwoo5pbx8Hi7LKUC6fuBepaHK5IED/nyTF6vCvJNBBTTay79zrJjb
MYElrNz/N19fg73L3ZeAGgK6n+7octBUQtgTYQOTkQKBgQDbPnm8JXCXC0TmHl/6
hOppPkWZnhg9zYbIfPHfadUBRUgxtNrFPWE25rIzxdhjrJ6AUtHYHGnsFNmoxSoS
p1oGgen8H0nh/Upj4PulmoqCKXIR8R0AuUPrHSRhICp/GXf4KlvaIelgUe7nIQPT
OaB70vYkdspB/dcdLbG4NaEoCQKBgQC5zHldZxcJQVJ06aTvi2LX5KT65ZtFpztn
Seok4KD9NfFgMm2kgSFmNZ+cn/BWR9FYBGRcdc0NfYR1MB1m8iX+oJo7wkbPpaYA
mVOP9yMi216HFhmpph+wU/rzVGR5H007OitT8YknZ7rYCjhd7H8rPG+iXOLpoPai
T2o5VOLIEwKBgEQcfKU+3GOQVK9I8HhbopdfiS/YNZ+9ognXBy1pK4thgrQug2iT
UQhFU0dSR49vqS4kjJye9ykosRYFarSw2P78jTyOW92hWuL8mjEweadGSPHZ/jCj
Xb5FJ3AlFg62Utb+EdsKff42dgnH7/BHDtxpBZ7+aIdn3NRrxbJ8trxBAoGAIKO8
Gl123YhdLO6yq+ZHqfefx/e4DEdxlxaUDIBtp63nRmf1fPW2YVdAP+qU9QNO0nCL
FPcY26rWLyQRtjkJ1a5vCdp6SBYokGhfFqZqxL/W3lJSlcv6Oya1qjOEJwcJsULp
w6hl2MdPOo6pEk7ulDDcx6AbuMEvMppS5dl0sYMCgYATqFMnQZ04CY4InSIE88Su
uL5i5HXRlSMcHf2fqaCzMqownIzfGYVJaCX/Q8bvANoqdCOjUHr8TPFR0G3s3ZVR
wN00uB2SKMkEyk5QiaUew6L+SF9R9oh80m3gF20QcmrdgeyKOXQ3X/j3u4NSPrU6
5vw4T5CeAeA7plO8UlAo1w==
-----END PRIVATE KEY-----`;

const adapterSecret = 'R6c1YPVFZX4bisnLt2vfoHua4ijNl4Hl2QV+P3WR6xM=';

try {
  console.log('Iniciando configuração do ambiente Convex...');
  
  // Remove quebras de linha para o CLI aceitar
  const cleanKey = privateKey.replace(/\n/g, '\\n');
  
  // Set Private Key
  execSync(`npx convex env set CONVEX_AUTH_PRIVATE_KEY -- "${cleanKey}"`, { stdio: 'inherit' });
  
  // Set Adapter Secret
  execSync(`npx convex env set CONVEX_AUTH_ADAPTER_SECRET -- "${adapterSecret}"`, { stdio: 'inherit' });
  
  console.log('✅ Chaves configuradas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao configurar chaves:', error.message);
}
