import { processLeadBatch } from './ldr_validator.js';

// Simulando uma lista bruta vinda da mineração (Maps/Receita)
const rawLeads = [
    { 
        name: "Clínica Odonto Sorriso", 
        site: "https://www.google.com", // Site ativo (Simulado)
        nota: 4.8, 
        avaliacoes: 150 
    },
    { 
        name: "Franquia OdontoTop Unidade Centro", 
        site: "https://odontotop.com.br", 
        nota: 4.5, 
        avaliacoes: 100 
    },
    { 
        name: "Mecânica do Zé", 
        site: "http://site-que-nao-existe-123456.com.br", 
        nota: 3.5, 
        avaliacoes: 10 
    },
    { 
        name: "Advocacia Rocha", 
        site: "https://www.linkedin.com", // Outro site ativo para teste
        nota: 4.2, 
        avaliacoes: 45 
    }
];

async function runTest() {
    console.log("--- INICIANDO TESTE DO CRIVO LDR ---");
    const cleanLeads = await processLeadBatch(rawLeads);
    
    console.log("--- RESULTADO FINAL (PRONTO PARA O BANCO) ---");
    console.log(JSON.stringify(cleanLeads, null, 2));
}

runTest().catch(console.error);
