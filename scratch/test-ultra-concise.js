const fs = require('fs');
const path = require('path');

let apiKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.log('Error reading .env file:', e.message);
}

const data = {
  nomeLoja: "Loja Teste",
  nomeResponsavel: "Responsavel Teste",
  contato: "11999999999",
  mediaVendas: "15",
  metaVendas: "30",
  temIA: "sim",
  fazTrafego: "sim",
  investimentoMarketing: "500000",
  investimentoTrafego: "300000",
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

const mediaVendas = 15;
const metaVendas = 30;
const gapVendas = 15;
const totalMarketing = 5000;
const trafegoInvest = 3000;
const carrosTrafego = 10;
const cac = "300.00";
const eficienciaTrafego = "67";
const rodaLucratividade = 6;
const rodaMetas = 7;
const rodaLeads = 5;
const rodaMaturidade = 6;
const rodaTimeVendas = 7;
const rodaVisitas = 5;
const rodaResultado = 6;
const rodaIndependencia = 5;
const rodaIA = 4;
const rodaSatisfacao = 8;
const rodaProcessoCompra = 7;

const prompt = `
Você é um consultor estratégico especialista no mercado automotivo. Seu objetivo é analisar os dados de um cliente e fornecer um plano de ação estratégico altamente personalizado em formato markdown.

DADOS DA CONCESSIONÁRIA:
- Nome da Loja: ${data.nomeLoja}
- Nome do Responsável: ${data.nomeResponsavel}
- Vendas Médias: ${mediaVendas} veículos/mês
- Meta de Vendas: ${metaVendas} veículos/mês (Gap: +${gapVendas})
- IA no atendimento? ${data.temIA === "sim" ? "SIM" : "NÃO"}
- Tráfego pago? ${data.fazTrafego === "sim" ? "SIM" : "NÃO"} (Investimento: R$ ${trafegoInvest.toFixed(2)}, Vendas: ${carrosTrafego}, CAC: R$ ${cac}, Participação: ${eficienciaTrafego}%)
- Portais? ${data.fazPortais === "sim" ? "SIM" : "NÃO"}
- Pré-Vendas/SDR? ${data.temPreVendas === "sim" ? "SIM" : "NÃO"}
- Marketing Mensal: R$ ${totalMarketing.toFixed(2)}

NOTAS DA AUTOAVALIAÇÃO (1 a 10):
- Lucratividade: ${rodaLucratividade}/10 | Metas: ${rodaMetas}/10 | Leads: ${rodaLeads}/10 | Maturidade: ${rodaMaturidade}/10 | Time Vendas: ${rodaTimeVendas}/10 | Visitas: ${rodaVisitas}/10 | Resultado: ${rodaResultado}/10 | Independência: ${rodaIndependencia}/10 | IA: ${rodaIA}/10 | Satisfação: ${rodaSatisfacao}/10 | Compra: ${rodaProcessoCompra}/10

DIRETRIZES DA ESTRATÉGIA:
1. Metas: Definir metas e visitas diárias.
2. Leads: Maxmizar portais, marketplace Facebook diário, tráfego com 3 carros vaca roxa (R$ 50/dia cada).
3. Maturidade: Playbook de vendas escrito e plano de ganhos individualizado.
4. Time: Treinamento mensal pelo dono ou externo semanal.
5. Visitas: Agenda cheia no dia anterior, script de conversão lead->visita. Se sem leads -> marketing; se com leads -> IA/SDR.
6. Resultado: Tratar marketing/IA/SDR conforme leads/visitas.
7. Independência: Comissão motivadora, repasse de leads, ajuda diária.
8. IA: Claude pago e ferramentas como Venda.IA.
9. Satisfação: Ligar para reclamações, pedir review Google, padrão de entrega.
10. Compra: Postar "Vendo seu carro em 30 min", comprar à vista na fachada, tráfego de captação.
11. Lucratividade: Margem real, separar CPF/CNPJ, cortar custos, aumentar preço.

REGRAS DE CONTEÚDO E FORMATAÇÃO (MUITO IMPORTANTES):
- Comece com 1-2 frases de parabéns.
- Escolha as 5 áreas com menores notas. Para cada uma delas, apresente 2 ações práticas diretas baseadas nas diretrizes. Use formato de tópicos curtos.
- Finalize com um cronograma rápido (Próximos Passos).
- O relatório deve ser ultra objetivo, conciso e sem enrolação, limitado a cerca de 400-500 palavras no total. Isso é necessário para que a IA gere a resposta rapidamente.
`;

async function test() {
  console.log("Calling Gemini API with ultra-concise prompt...");
  const start = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const resData = await response.json();
    const timeTaken = Date.now() - start;
    console.log("Status:", response.status);
    console.log("Time taken:", timeTaken, "ms");
    const text = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Text length:", text.length, "characters (~", Math.round(text.length / 4), "words)");
    console.log("Snippet:\n", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
