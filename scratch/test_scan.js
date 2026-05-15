import axios from 'axios';

async function testScan() {
    try {
        console.log('--- TESTE DE SCAN ---');
        const res = await axios.post('http://localhost:3006/api/receita/scan', {
            uf: 'PR',
            cidade: 'CURITIBA',
            cnae: '8630'
        });
        console.log('Status:', res.status);
        console.log('Leads encontrados:', res.data.leads?.length || 0);
        if (res.data.leads?.length > 0) {
            console.log('Exemplo:', res.data.leads[0].name);
        }
    } catch (e) {
        console.error('Erro no teste:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

testScan();
