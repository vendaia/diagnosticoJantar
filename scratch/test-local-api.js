const fs = require('fs');
const path = require('path');

const sampleData = {
  nomeLoja: "Loja Teste",
  nomeResponsavel: "Responsavel Teste",
  contato: "11999999999",
  mediaVendas: "15",
  metaVendas: "30",
  temIA: "sim",
  fazTrafego: "sim",
  investimentoMarketing: "500000", // R$ 5.000,00 (will be parsed to 5000)
  investimentoTrafego: "300000", // R$ 3.000,00
  carrosTrafego: "10",
  fazPortais: "sim",
  temPreVendas: "sim",
  rodaLucratividade: 6,
  rodaMetas: 7,
  rodaLeads: 5,
  rodaMaturidade: 6,
  rodaTimeVendas: 7,
  rodaVisitas: 5,
  rodaResultado: 6,
  rodaIndependencia: 5,
  rodaIA: 4,
  rodaSatisfacao: 8,
  rodaProcessoCompra: 7
};

async function runTest() {
  console.log("Calling local API endpoint /api/diagnostico...");
  const start = Date.now();
  try {
    const response = await fetch("http://localhost:3001/api/diagnostico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sampleData)
    });
    
    console.log("Status:", response.status);
    const timeTaken = Date.now() - start;
    console.log(`Time taken: ${timeTaken} ms (${(timeTaken / 1000).toFixed(2)} seconds)`);
    
    const text = await response.text();
    console.log("Response text length:", text.length);
    try {
      const json = JSON.parse(text);
      console.log("Response JSON snippet:", JSON.stringify(json).substring(0, 500));
    } catch (e) {
      console.log("Response is not JSON! Head of response:", text.substring(0, 500));
    }
  } catch (err) {
    console.error("Error making request:", err);
  }
}

runTest();
