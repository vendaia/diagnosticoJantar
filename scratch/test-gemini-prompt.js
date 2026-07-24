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

function getPrompt(concise) {
  return `
Você é um consultor estratégico especialista no mercado automotivo (concessionárias e lojas de veículos multimarcas). Seu objetivo é analisar os dados de um cliente e fornecer um plano de ação estratégico altamente personalizado em formato markdown.

DADOS DA CONCESSIONÁRIA ANALISADA:
- Nome da Loja: ${data.nomeLoja}
- Nome do Responsável: ${data.nomeResponsavel}
- Contato (WhatsApp): ${data.contato}
- Vendas Médias Atuais: ${mediaVendas} veículos/mês
- Meta de Vendas Desejada: ${metaVendas} veículos/mês
- Distância Comercial (Gap de Vendas): +${gapVendas} veículos/mês
- Utiliza Inteligência Artificial (IA) no atendimento? ${data.temIA === "sim" ? "SIM" : "NÃO"}
- Faz tráfego pago próprio (Meta/Google Ads)? ${data.fazTrafego === "sim" ? "SIM" : "NÃO"}
${data.fazTrafego === "sim" ? `  * Investimento mensal em tráfego: R$ ${trafegoInvest.toFixed(2)}\n  * Veículos vendidos pelo tráfego rastreado: ${carrosTrafego}\n  * Custo de Aquisição por Veículo (CAC): R$ ${cac}\n  * Participação do tráfego nas vendas: ${eficienciaTrafego}%` : ""}
- Anuncia em portais (Webmotors, OLX, iCarros, etc.)? ${data.fazPortais === "sim" ? "SIM" : "NÃO"}
- Tem estrutura de Pré-Vendas / SDR? ${data.temPreVendas === "sim" ? "SIM" : "NÃO"}
- Investimento total de Marketing Mensal: R$ ${totalMarketing.toFixed(2)}

AUTOAVALIAÇÃO - RODA DO DIAGNÓSTICO NOVA ERA (Notas de 1 a 10 atribuídas pela loja):
- Lucratividade: ${rodaLucratividade}/10
- Metas claras e definidas: ${rodaMetas}/10
- Geração de leads / oportunidades: ${rodaLeads}/10
- Maturidade comercial: ${rodaMaturidade}/10
- Time de vendas treinado: ${rodaTimeVendas}/10
- Visitas diárias na loja: ${rodaVisitas}/10
- Resultado de vendas: ${rodaResultado}/10
- Não dependência do dono nas vendas: ${rodaIndependencia}/10
- Inteligência artificial: ${rodaIA}/10
- Satisfação do cliente e boca a boca: ${rodaSatisfacao}/10
- Processo de compra: ${rodaProcessoCompra}/10

DIRETRIZES E REGRAS DE ESTRATÉGIA (Use estes princípios para fundamentar suas recomendações):

1. **Metas Claras e Definidas**:
   - Definir meta mês a mês até o final do ano [mínima, meta, e super meta].
   - Analisar retroativo e definir de quantas visitas precisa para vender um carro.
   - Definir meta de visitas diárias e acompanhar.

2. **Geração de Leads/Oportunidades**:
   - Estar no máximo de portais com o mínimo de investimento.
   - Atualizar diariamente o marketplace do Facebook.
   - Selecionar os 3 melhores carros "vaca roxa" do estoque (um de cada categoria), produzir variação de criativos (1 vídeo em selfie, 1 vídeo terceira pessoa e 1 estático com preço + diferenciais) e rodar R$ 50,00 por dia em cada um no tráfego pago.
   - Avaliar a necessidade de trocar de gestor de tráfego caso os resultados estejam abaixo do esperado ou sem métricas claras.

3. **Maturidade Comercial**:
   - Criar com ajuda de Inteligência Artificial o seu PLAYBOOK DE VENDAS com todas as informações por escrito de como o dono venderia.
   - Apresentar individualmente para cada membro da equipe quanto ele pode ganhar se bater a meta mínima, meta e super.

4. **Time de Vendas Treinado**:
   - Implantar treinamento mensal conduzido pelo próprio dono.
   - Considerar contratar uma empresa externa para treinar a equipe semanalmente.

5. **Visitas Diárias na Loja**:
   - Começar a trabalhar com agenda e ficar fissurado em lotar a do dia seguinte todos os dias.
   - Implantar script de conversão de leads em visitas físicas.
   - Se faltam leads: aumentar investimento em marketing.
   - Se tem leads: contratar IA ou implantar pré-vendas (SDR).

6. **Resultado de Vendas**:
   - Se faltam leads: aumentar investimento em marketing.
   - Se tem leads: contratar IA ou implantar pré-vendas para transformar os leads em visitas.
   - Se tem visitas na loja: treinar o vendedor em processos de vendas matadores.

7. **Não Dependência do Dono nas Vendas**:
   - Criar sistema de comissionamento que pague bem o vendedor (fazer com que ele queira vender igual ao dono, mas mantendo a comissão proporcional).
   - Apresentar ao time o quanto cada um ganha se bater as metas.
   - Ajudar a equipe diariamente e repassar vendas do dono para a equipe.

8. **Inteligência Artificial**:
   - Contratar a versão paga do Claude para elaboração de copys, análises e playbooks.
   - Contratar soluções de IA voltadas para vendas automotivas (como Venda.IA ou concorrentes).

9. **Satisfação do Cliente e Boca a Boca**:
   - Se a reputação estiver muito ruim: considerar um rebranding (nova marca).
   - Se forem problemas pontuais: ligar pessoalmente para os clientes com reclamação para resolver e pedir para retirar a reclamação. Ligar para os satisfeitos para pedir boas avaliações.
   - Criar um procedimento padrão de encantamento na entrega do veículo e pós-venda.
   - Solicitar avaliação no Google Meu Negócio em toda compra.

10. **Processo de Compra (Captação de Estoque)**:
     - Postar nas redes sociais: "VENDO SEU CARRO EM 30 MIN".
     - Estampar na fachada da loja que "COMPRA E PAGA À VISTA".
     - Implantar funil de captação de compra via tráfego pago.

11. **Lucratividade**:
     - Calcular a real margem bruta por carro.
     - Separar estritamente o CPF (finanças do dono) e o CNPJ (finanças da empresa).
     - Cortar qualquer despesa que não traga retorno direto.
     - Aumentar o preço médio dos carros e buscar maior retorno de financiamento junto aos bancos/financeiras.

SUAS INSTRUÇÕES DE FORMATAÇÃO E CONTEÚDO:
1. Comece com uma introdução marcante parabenizando a ${data.nomeLoja} por dar esse passo estratégico de autoavaliação e diagnóstico.
2. Identifique os **5 pontos (áreas de foco/prioridade) mais críticos** para esta loja de veículos. Escolha estes 5 pontos com base nas **menores notas da Roda de Autoavaliação** (pontuações mais baixas) e que possuam forte impacto no gap comercial da loja. Ao introduzir cada ponto no relatório, inclua a nota da autoavaliação correspondente, por exemplo: '**Metas Claras e Definidas (Autoavaliação: X/10)**'.
3. Para cada um dos **5 pontos selecionados**, apresente **de 2 a 3 ações práticas e específicas**, integrando diretamente e citando as diretrizes de estratégia correspondentes listadas acima. Personalize as ações para o contexto atual de vendas e marketing informado pela loja.
4. Conclua com um plano rápido de "Próximos Passos Comerciais" no formato de cronograma de implantação rápida.

${concise ? `REGRA DE CONCISÃO OBRIGATÓRIA (CRÍTICA):
- O plano deve ser extremamente prático, direto e focado em ações concretas.
- Seja breve na introdução e conclusão (máximo de 2-3 frases).
- Descreva cada ação prática de forma resumida e direta usando tópicos curtos (bullet points), sem parágrafos longos ou enrolação.
- O texto total gerado deve ser curto (menos de 600 palavras) para garantir carregamento instantâneo.
` : ''}
`;
}

async function test(concise) {
  const label = concise ? "CONCISE PROMPT" : "ORIGINAL PROMPT";
  console.log(`\n--- Testando Gemini API com ${label} ---`);
  const startGemini = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: getPrompt(concise) }] }],
        }),
      }
    );
    const resData = await response.json();
    const timeTaken = Date.now() - startGemini;
    console.log(`${label} Status:`, response.status);
    console.log(`${label} Time:`, timeTaken, 'ms');
    const text = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`${label} Length:`, text.length, 'characters (~', Math.round(text.length / 4), 'words)');
    console.log(`${label} Snippet:`, text.substring(0, 300) + "...");
  } catch (err) {
    console.error('Gemini Error:', err);
  }
}

async function run() {
  await test(true);
}

run();
