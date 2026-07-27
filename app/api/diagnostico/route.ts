import { NextResponse, after } from "next/server";

export const maxDuration = 60; // Evita timeout de 504 no Netlify/Vercel aumentando o limite de execução

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada no servidor." },
        { status: 500 }
      );
    }

    // Calcular CAC e métricas adicionais para auxiliar a IA na análise
    const mediaVendas = parseInt(data.mediaVendas) || 0;
    const metaVendas = parseInt(data.metaVendas) || 0;
    const gapVendas = Math.max(0, metaVendas - mediaVendas);
    const totalMarketing = parseFloat(String(data.investimentoMarketing || "").replace(/\D/g, "")) / 100 || 0;
    const trafegoInvest = data.fazTrafego === "sim" 
      ? parseFloat(String(data.investimentoTrafego || "").replace(/\D/g, "")) / 100 || 0 
      : 0;
    const carrosTrafego = data.fazTrafego === "sim" ? parseInt(data.carrosTrafego) || 0 : 0;
    const cac = carrosTrafego > 0 ? (trafegoInvest / carrosTrafego).toFixed(2) : "N/A";
    const eficienciaTrafego = mediaVendas > 0 ? ((carrosTrafego / mediaVendas) * 100).toFixed(0) : "0";

    // Novos campos de funil e lucro por carro
    const lucroPorCarro = parseFloat(String(data.lucroPorCarro || "").replace(/\D/g, "")) / 100 || 0;
    const leadsMes = parseInt(data.leadsMes) || 0;
    const visitasMes = parseInt(data.visitasMes) || 0;

    // Calcular perda financeira decorrente do GAP comercial
    const lostRevenueMonth = gapVendas * lucroPorCarro;
    const lostRevenueYear = lostRevenueMonth * 12;

    // Calcular conversões reais do funil
    const convLeadVisita = leadsMes > 0 ? (visitasMes / leadsMes) * 100 : 0;
    const convVisitaVenda = visitasMes > 0 ? (mediaVendas / visitasMes) * 100 : 0;
    const convGeral = leadsMes > 0 ? (mediaVendas / leadsMes) * 100 : 0;

    // Notas da autoavaliação da Roda de Diagnóstico Nova Era
    const rodaLucratividade = data.rodaLucratividade || 5;
    const rodaMetas = data.rodaMetas || 5;
    const rodaLeads = data.rodaLeads || 5;
    const rodaMaturidade = data.rodaMaturidade || 5;
    const rodaTimeVendas = data.rodaTimeVendas || 5;
    const rodaVisitas = data.rodaVisitas || 5;
    const rodaResultado = data.rodaResultado || 5;
    const rodaIndependencia = data.rodaIndependencia || 5;
    const rodaIA = data.rodaIA || 5;
    const rodaSatisfacao = data.rodaSatisfacao || 5;
    const rodaProcessoCompra = data.rodaProcessoCompra || 5;

    // Criar o prompt detalhado incorporando as respostas do formulário e as diretrizes do usuário
    const prompt = `
Você é um consultor estratégico especialista no mercado automotivo (concessionárias e lojas de veículos multimarcas). Seu objetivo é analisar os dados de um cliente e fornecer um plano de ação estratégico altamente personalizado em formato markdown.

DADOS DA CONCESSIONÁRIA ANALISADA:
- Nome da Loja: ${data.nomeLoja}
- Nome do Responsável: ${data.nomeResponsavel}
- Contato (WhatsApp): ${data.contato}
- Vendas Médias Atuais: ${mediaVendas} veículos/mês
- Meta de Vendas Desejada: ${metaVendas} veículos/mês
- Distância Comercial (Gap de Vendas): +${gapVendas} veículos/mês
- Lucro Médio por Carro (Margem): R$ ${lucroPorCarro.toFixed(2)}
- Perda Financeira Estimada pelo Gap: R$ ${lostRevenueMonth.toFixed(2)}/mês (R$ ${lostRevenueYear.toFixed(2)}/ano)
- Quantidade de Leads por Mês: ${leadsMes}
- Quantidade de Visitas Físicas por Mês: ${visitasMes}
- Taxas de Conversão Reais da Loja:
  * Conversão Lead para Visita: ${convLeadVisita.toFixed(1)}% (Leads: ${leadsMes} -> Visitas: ${visitasMes})
  * Conversão Visita para Venda: ${convVisitaVenda.toFixed(1)}% (Visitas: ${visitasMes} -> Vendas: ${mediaVendas})
  * Conversão Geral (Lead para Venda): ${convGeral.toFixed(1)}%
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

SUAS INSTRUÇÕES DE FORMATAÇÃO, CONSISTÊNCIA E CONTEÚDO:
1. Comece com uma introdução de no máximo 2 sentenças parabenizando a ${data.nomeLoja} por dar esse passo estratégico de autoavaliação e diagnóstico.
2. **REGRA CRÍTICA DE CONSISTÊNCIA DE DADOS**: Você NUNCA deve parabenizar a loja ou dizer "Excelente!" ou "Parabéns!" pelo uso de IA, SDR, Tráfego Pago ou Portais se no formulário consta que a resposta foi "NÃO". Se responderam NÃO para IA ou SDR, trate isso estritamente como um gargalo crítico a ser corrigido e uma recomendação de ação necessária. Se responderam SIM, você pode reconhecer, mas focando em como melhorar o aproveitamento.
3. Identifique os **5 pontos (áreas de foco/prioridade) mais críticos** para esta loja de veículos. Escolha estes 5 pontos com base nas **menores notas da Roda de Autoavaliação** (pontuações mais baixas) e que possuam forte impacto no gap comercial da loja. Ao introduzir cada ponto no relatório, inclua a nota da autoavaliação correspondente, por exemplo: '**Metas Claras e Definidas (Autoavaliação: X/10)**'.
4. Para cada um dos **5 pontos selecionados**, apresente **de 2 a 3 ações práticas e específicas**, integrando diretamente e citando as diretrizes de estratégia correspondentes listadas acima. Cada ação deve ser escrita de forma extremamente objetiva, curta e em tópicos (bullet points), sem parágrafos extensos.
5. Incorpore a análise de perda financeira (R$ ${lostRevenueMonth.toLocaleString('pt-BR')} / mês ou R$ ${lostRevenueYear.toLocaleString('pt-BR')} / ano) e o vazamento do funil de conversão (exemplo: ${leadsMes} leads gerando apenas ${visitasMes} visitas) nas seções apropriadas de forma a destacar que a loja está deixando muito dinheiro na mesa por falta de processo comercial.
6. Conclua com um plano rápido de "Próximos Passos Comerciais" no formato de cronograma de implantação rápida de 4 semanas.
7. REGRA CRÍTICA DE DESEMPENHO: O relatório inteiro deve ser conciso e focado, contendo entre 400 e 600 palavras no total, para garantir geração ultra rápida pela IA.
`;

    // Chamada REST à API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro na API do Gemini:", errorData);
      return NextResponse.json(
        { error: "Erro ao comunicar com a API do Gemini. Detalhes: " + (errorData.error?.message || response.statusText) },
        { status: 502 }
      );
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: "Nenhum conteúdo retornado pela IA do Gemini." },
        { status: 500 }
      );
    }

    // Agendar o envio dos dados para o Webhook do n8n em segundo plano após o retorno da resposta ao usuário
    after(async () => {
      const webhookUrl = "https://n8n.aegmedia.com.br/webhook/c1d2aa19-2b46-4a31-b16f-d7c64eee11d1";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos de limite para o webhook em background

        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            formData: data,
            metrics: {
              mediaVendas,
              metaVendas,
              gapVendas,
              totalMarketing,
              trafegoInvest,
              carrosTrafego,
              cac,
              eficienciaTrafego,
              lucroPorCarro,
              leadsMes,
              visitasMes,
              lostRevenueMonth,
              lostRevenueYear,
              convLeadVisita,
              convVisitaVenda,
              convGeral,
            },
            report: generatedText,
          }),
        });
        clearTimeout(timeoutId);
        console.log("Dados do diagnóstico enviados com sucesso para o webhook do n8n.");
      } catch (webhookError: any) {
        console.error("Erro ao enviar dados para o webhook do n8n:", webhookError.name === 'AbortError' ? 'Timeout' : webhookError.message);
      }
    });

    return NextResponse.json({ report: generatedText });
  } catch (error: any) {
    console.error("Erro interno na rota do diagnóstico:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor: " + error.message },
      { status: 500 }
    );
  }
}
