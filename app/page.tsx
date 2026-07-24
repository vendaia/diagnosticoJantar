"use client";

import React, { useState } from "react";

interface FormData {
  nomeLoja: string;
  nomeResponsavel: string;
  contato: string;
  mediaVendas: string;
  metaVendas: string;
  fazTrafego: string; // "sim" | "nao"
  investimentoTrafego: string;
  carrosTrafego: string;
  fazPortais: string; // "sim" | "nao"
  investimentoMarketing: string;
  temIA: string; // "sim" | "nao"
  temPreVendas: string; // "sim" | "nao"
  // Roda do Diagnóstico scores (1 to 10)
  rodaLucratividade: number | "";
  rodaMetas: number | "";
  rodaLeads: number | "";
  rodaMaturidade: number | "";
  rodaTimeVendas: number | "";
  rodaVisitas: number | "";
  rodaResultado: number | "";
  rodaIndependencia: number | "";
  rodaIA: number | "";
  rodaSatisfacao: number | "";
  rodaProcessoCompra: number | "";
}

const initialData: FormData = {
  nomeLoja: "",
  nomeResponsavel: "",
  contato: "",
  mediaVendas: "",
  metaVendas: "",
  fazTrafego: "nao",
  investimentoTrafego: "",
  carrosTrafego: "",
  fazPortais: "nao",
  investimentoMarketing: "",
  temIA: "nao",
  temPreVendas: "nao",
  // Roda scores defaults
  rodaLucratividade: 5,
  rodaMetas: 5,
  rodaLeads: 5,
  rodaMaturidade: 5,
  rodaTimeVendas: 5,
  rodaVisitas: 5,
  rodaResultado: 5,
  rodaIndependencia: 5,
  rodaIA: 5,
  rodaSatisfacao: 5,
  rodaProcessoCompra: 5,
};

export default function Home() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Gemini AI States
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>("");
  const [aiReport, setAiReport] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ai" | "metrics">("ai");
  const [copied, setCopied] = useState<boolean>(false);
  const [lastClickedPoint, setLastClickedPoint] = useState<{
    key: string;
    value: number;
    time: number;
  } | null>(null);

  // Formatting utilities
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (_, p1, p2, p3) => {
        if (!p2) return p1 ? `(${p1}` : "";
        return `(${p1}) ${p2}${p3 ? "-" + p3 : ""}`;
      });
    } else {
      return cleaned.slice(0, 11).replace(/^(\d{2})(\d{0,5})(\d{0,4})$/, (_, p1, p2, p3) => {
        return `(${p1}) ${p2}-${p3}`;
      });
    }
  };

  const formatCurrency = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return "";
    const numberValue = parseFloat(cleaned) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const parseCurrency = (formatted: string): number => {
    const cleaned = formatted.replace(/\D/g, "");
    return cleaned ? parseFloat(cleaned) / 100 : 0;
  };

  const handleInputChange = (key: keyof FormData, value: string | number) => {
    let formattedValue = value;
    if (typeof value === "string") {
      if (key === "contato") {
        formattedValue = formatPhone(value);
      } else if (key === "investimentoTrafego" || key === "investimentoMarketing") {
        formattedValue = formatCurrency(value);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [key]: formattedValue,
    }));

    // Clear error
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleRadarClick = (key: keyof FormData, level: number) => {
    handleInputChange(key, level);
    setLastClickedPoint({
      key,
      value: level,
      time: Date.now(),
    });
  };

  const validateStep = (currentStep: number): boolean => {
    const stepErrors: Partial<Record<keyof FormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.nomeLoja.trim()) stepErrors.nomeLoja = "Nome da loja é obrigatório";
      if (!formData.nomeResponsavel.trim()) stepErrors.nomeResponsavel = "Nome do responsável é obrigatório";
      if (formData.contato.replace(/\D/g, "").length < 10) {
        stepErrors.contato = "Insira um número de contato válido";
      }
    }

    if (currentStep === 2) {
      if (!formData.mediaVendas || parseInt(formData.mediaVendas) < 0) {
        stepErrors.mediaVendas = "Insira uma média de vendas válida";
      }
      if (!formData.metaVendas || parseInt(formData.metaVendas) < 0) {
        stepErrors.metaVendas = "Insira uma meta de vendas válida";
      }
    }

    if (currentStep === 3) {
      if (formData.fazTrafego === "sim") {
        if (!formData.investimentoTrafego) {
          stepErrors.investimentoTrafego = "Informe o investimento em tráfego";
        }
        if (!formData.carrosTrafego || parseInt(formData.carrosTrafego) < 0) {
          stepErrors.carrosTrafego = "Informe a quantidade de carros vendidos por tráfego";
        }
      }
      if (!formData.investimentoMarketing) {
        stepErrors.investimentoMarketing = "Informe o investimento total em marketing";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoadingAI(true);
    setLoadingStepText("Iniciando auditoria dos dados da loja...");

    const steps = [
      "Mapeando o volume de vendas e calculando GAP comercial...",
      "Analisando métricas de tráfego, orçamentos e CAC...",
      "Avaliando maturidade estrutural (IA, SDR, Portais)...",
      "Processando as diretrizes de comissionamento, liderança e processos...",
      "Gemini IA estruturando o plano de ação personalizado..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStepText(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      const res = await fetch("/api/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao conectar com o serviço de IA.");
      }

      const resData = await res.json();
      setAiReport(resData.report || "");
      setIsSubmitted(true);
      setActiveTab("ai");
    } catch (err: any) {
      clearInterval(interval);
      alert(err.message || "Ocorreu um erro ao gerar o diagnóstico pela IA. Tente novamente.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // DIAGNOSTIC ENGINE CALCULATIONS
  const mediaVendasNum = parseInt(formData.mediaVendas) || 0;
  const metaVendasNum = parseInt(formData.metaVendas) || 0;
  const gapVendas = Math.max(0, metaVendasNum - mediaVendasNum);

  const totalMarketing = parseCurrency(formData.investimentoMarketing);
  const trafegoInvest = formData.fazTrafego === "sim" ? parseCurrency(formData.investimentoTrafego) : 0;
  const carrosTrafegoNum = formData.fazTrafego === "sim" ? parseInt(formData.carrosTrafego) || 0 : 0;

  // Calculo de CAC
  const cacTrafego = carrosTrafegoNum > 0 ? trafegoInvest / carrosTrafegoNum : 0;

  // Eficiencia do tráfego pago
  const eficienciaTrafego = mediaVendasNum > 0 ? (carrosTrafegoNum / mediaVendasNum) * 100 : 0;

  // Custo médio de marketing por carro vendido
  const marketingPorCarro = mediaVendasNum > 0 ? totalMarketing / mediaVendasNum : 0;

  // Score de Maturidade Digital
  let scoreMaturidade = 20;
  if (formData.temIA === "sim") scoreMaturidade += 20;
  if (formData.temPreVendas === "sim") scoreMaturidade += 20;
  if (formData.fazTrafego === "sim") scoreMaturidade += 20;
  if (formData.fazPortais === "sim") scoreMaturidade += 20;

  // Se tem tráfego e o CAC for saudável ou excelente, ganha um bônus de eficiência digital
  if (formData.fazTrafego === "sim" && cacTrafego > 0) {
    if (cacTrafego < 400) scoreMaturidade += 20;
    else if (cacTrafego < 900) scoreMaturidade += 10;
  }
  scoreMaturidade = Math.min(100, scoreMaturidade);

  // Recommendations builder
  const getRecommendations = () => {
    const recs = [];

    // IA
    if (formData.temIA === "nao") {
      recs.push({
        status: "critical",
        title: "Integração de Inteligência Artificial",
        desc: "Você está perdendo leads fora do horário comercial. Concessionárias que utilizam IA para triagem inicial qualificam 4x mais leads e reduzem o tempo de resposta para menos de 2 minutos.",
      });
    } else {
      recs.push({
        status: "success",
        title: "Uso de Inteligência Artificial",
        desc: "Excelente! O uso de IA no atendimento posiciona a loja à frente da concorrência, otimizando o primeiro contato e garantindo atendimento 24/7.",
      });
    }

    // Pré-Vendas / SDR
    if (formData.temPreVendas === "nao") {
      recs.push({
        status: "warning",
        title: "Estruturação de Pré-Vendas (SDR)",
        desc: "Seus vendedores estão perdendo tempo precioso com curiosos (leads frios). Implementar um SDR para qualificar e agendar visitas pode aumentar o fechamento de vendas dos vendedores em até 60%.",
      });
    } else {
      recs.push({
        status: "success",
        title: "Processo de Pré-Vendas (SDR)",
        desc: "Parabéns por ter um pré-vendedor! Isso garante foco total dos seus vendedores em quem realmente quer comprar.",
      });
    }

    // Tráfego Pago & CAC
    if (formData.fazTrafego === "nao") {
      recs.push({
        status: "critical",
        title: "Iniciar Tráfego Pago Próprio",
        desc: "Depender apenas de portais coloca sua margem sob pressão. O tráfego pago próprio (Meta/Google Ads) gera leads exclusivos e ajuda a construir a marca da sua própria loja.",
      });
    } else {
      if (cacTrafego > 1500) {
        recs.push({
          status: "critical",
          title: "Otimização Urgente de Tráfego (CAC Crítico)",
          desc: `Seu CAC de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cacTrafego)} está muito alto para a média do mercado (referência saudável: R$ 300 - R$ 800). Verifique a qualidade dos anúncios, segmentações ou o tempo de resposta da sua equipe de vendas.`,
        });
      } else if (cacTrafego > 800) {
        recs.push({
          status: "warning",
          title: "Melhorar Conversão de Tráfego (CAC Alto)",
          desc: `Seu CAC está em R$ ${cacTrafego.toFixed(2)}. Há espaço para otimizar os criativos de ofertas e treinar os pré-vendedores para melhorar a taxa de conversão do lead para a visita à loja.`,
        });
      } else if (cacTrafego > 0) {
        recs.push({
          status: "success",
          title: "Eficiência de Tráfego Saudável",
          desc: `Muito bom! Seu CAC de R$ ${cacTrafego.toFixed(2)} está dentro da faixa saudável de mercado. A recomendação aqui é escalar o investimento gradativamente para aumentar o volume de vendas.`,
        });
      }
    }

    // Portais
    if (formData.fazPortais === "nao") {
      recs.push({
        status: "info",
        title: "Presença em Portais",
        desc: "Embora o tráfego pago próprio seja excelente para margem, portais como Webmotors e OLX contam com alto tráfego de intenção imediata. Considere anunciar seus modelos de maior giro.",
      });
    }

    // Planejamento de Vendas / GAP
    if (gapVendas > 0) {
      const benchmarkCac = cacTrafego > 0 ? cacTrafego : 500;
      const investimentoAdicional = gapVendas * benchmarkCac;
      recs.push({
        status: "info",
        title: `Plano para Bater a Meta (+${gapVendas} vendas)`,
        desc: `Para cobrir a distância de ${gapVendas} veículos adicionais mensais, estima-se um investimento incremental de aproximadamente ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(investimentoAdicional)} em tráfego pago, considerando seu CAC de R$ ${benchmarkCac.toFixed(0)}.`,
      });
    }

    return recs;
  };

  const getMaturidadeBadge = (score: number) => {
    if (score < 40) return { label: "Iniciante Digital", color: "bg-red-950/80 text-red-400 border-red-900/50" };
    if (score < 70) return { label: "Em Evolução", color: "bg-amber-950/80 text-amber-400 border-amber-900/50" };
    return { label: "Líder Digital", color: "bg-emerald-950/80 text-emerald-400 border-emerald-900/50" };
  };

  const buildWhatsappShareLink = () => {
    const message = `*DIAGNÓSTICO AUTOMOTIVO DE MATURIDADE* 🚀\n` +
      `---------------------------------\n` +
      `🏢 *Loja:* ${formData.nomeLoja}\n` +
      `👤 *Responsável:* ${formData.nomeResponsavel}\n` +
      `📈 *Média de Vendas:* ${formData.mediaVendas} carros/mês\n` +
      `🎯 *Meta de Vendas:* ${formData.metaVendas} carros/mês\n` +
      `🏆 *Pontuação de Maturidade:* ${scoreMaturidade}/100\n` +
      `---------------------------------\n` +
      `💰 *Métricas Calculadas:*\n` +
      `• *Investimento Mkt Total:* ${formData.investimentoMarketing}\n` +
      (formData.fazTrafego === "sim" ? `• *CAC do Tráfego:* R$ ${cacTrafego.toFixed(2)} por carro\n` : `• *Não faz tráfego pago próprio*\n`) +
      `• *Mkt por Carro Vendido:* R$ ${marketingPorCarro.toFixed(2)}\n` +
      (gapVendas > 0 ? `• *Distância p/ Meta:* +${gapVendas} carros/mês\n` : `• *Status da Meta:* Meta Atingida! 🎉\n`) +
      `---------------------------------\n` +
      `🛠️ *Estrutura Atual:*\n` +
      `• IA no Atendimento: ${formData.temIA === "sim" ? "Sim ✅" : "Não ❌"}\n` +
      `• Pré-vendas (SDR): ${formData.temPreVendas === "sim" ? "Sim ✅" : "Não ❌"}\n` +
      `• Anuncia em Portais: ${formData.fazPortais === "sim" ? "Sim ✅" : "Não ❌"}\n\n` +
      `👉 Gerado automaticamente via Diagnóstico Automotivo Inteligente.`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  // Helper de renderização do relatório do Gemini em Markdown
  const formatText = (text: string): React.ReactNode => {
    if (!text) return "";

    // Split by bold (**...**)
    const boldParts = text.split(/(\*\*.*?\*\*)/g);

    return boldParts.map((boldPart, bIdx) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        const inner = boldPart.slice(2, -2);
        return (
          <strong key={`b-${bIdx}`} className="font-extrabold text-white">
            {formatItalicText(inner)}
          </strong>
        );
      }
      return <React.Fragment key={`n-${bIdx}`}>{formatItalicText(boldPart)}</React.Fragment>;
    });
  };

  const formatItalicText = (text: string): React.ReactNode => {
    if (!text) return "";
    // Split by italic (*...*)
    const italicParts = text.split(/(\*.*?\*)/g);
    return italicParts.map((italicPart, iIdx) => {
      if (italicPart.startsWith("*") && italicPart.endsWith("*") && italicPart.length > 2) {
        return (
          <em key={`i-${iIdx}`} className="italic text-zinc-300">
            {italicPart.slice(1, -1)}
          </em>
        );
      }
      return italicPart;
    });
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Check if divider: --- or ***
      if (trimmed.match(/^[-*_]{2,}$/)) {
        return <hr key={idx} className="my-6 border-zinc-900" />;
      }

      // Check if header: #, ##, ###
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        let cleanText = headerMatch[2].trim();
        // Clean any leading/trailing stars from the header title
        cleanText = cleanText.replace(/^\*\*|\*\*$/g, "").replace(/^\*|\*$/g, "");

        if (level === 1) {
          return (
            <h1 key={idx} className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mt-10 mb-6 uppercase tracking-wider">
              {cleanText}
            </h1>
          );
        } else if (level === 2) {
          return (
            <h2 key={idx} className="text-lg font-bold text-white mt-8 mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
              {cleanText}
            </h2>
          );
        } else {
          return (
            <h3 key={idx} className="text-base font-bold text-indigo-400 mt-6 mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              {cleanText}
            </h3>
          );
        }
      }

      // Check if unordered list item: "- item" or "* item" (must be followed by a space)
      const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
      if (ulMatch) {
        const rawContent = ulMatch[1].trim();
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-zinc-300 mb-2 leading-relaxed">
            {formatText(rawContent)}
          </li>
        );
      }

      // Check if ordered list item: "1. item"
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        const num = olMatch[1];
        const rawContent = olMatch[2].trim();
        return (
          <div key={idx} className="flex items-start gap-2 text-sm text-zinc-300 mb-3 leading-relaxed ml-2">
            <span className="font-extrabold text-indigo-400">{num}.</span>
            <div className="flex-1">{formatText(rawContent)}</div>
          </div>
        );
      }

      if (trimmed === "") {
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="text-sm text-zinc-300 mb-3 leading-relaxed">
          {formatText(trimmed)}
        </p>
      );
    });
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(aiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eixos = [
    { key: "rodaLucratividade", label: "Lucratividade" },
    { key: "rodaMetas", label: "Metas claras" },
    { key: "rodaLeads", label: "Geração de leads" },
    { key: "rodaMaturidade", label: "Maturidade com." },
    { key: "rodaTimeVendas", label: "Time treinado" },
    { key: "rodaVisitas", label: "Visitas diárias" },
    { key: "rodaResultado", label: "Resultado vendas" },
    { key: "rodaIndependencia", label: "Independência dono" },
    { key: "rodaIA", label: "Inteligência Art." },
    { key: "rodaSatisfacao", label: "Satisfação/Boca" },
    { key: "rodaProcessoCompra", label: "Processo compra" },
  ] as const;

  const renderRadarChart = (size = 300, interactive = false) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.38;

    const coordinates = eixos.map((eixo, i) => {
      const angle = (i * 360) / 11 - 90;
      const rad = (angle * Math.PI) / 180;
      const val = formData[eixo.key];
      const score = typeof val === "number" ? val : 5;

      const xOuter = cx + R * Math.cos(rad);
      const yOuter = cy + R * Math.sin(rad);

      const xScore = cx + (score / 10) * R * Math.cos(rad);
      const yScore = cy + (score / 10) * R * Math.sin(rad);

      return { xOuter, yOuter, xScore, yScore, label: eixo.label, key: eixo.key, rad, angle };
    });

    const polygonPoints = coordinates.map(c => `${c.xScore},${c.yScore}`).join(" ");

    const concentricCircles = [];
    for (let level = 1; level <= 10; level++) {
      const radius = (level / 10) * R;
      concentricCircles.push(
        <circle
          key={level}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible relative z-10 w-full h-auto"
        style={{ maxWidth: size, maxHeight: size }}
      >
        {/* Concentric circles */}
        {concentricCircles}

        {/* Axis lines */}
        {coordinates.map((c, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={c.xOuter}
            y2={c.yOuter}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
          />
        ))}

        {/* Current score polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Interactive numbers along the axes */}
        {interactive && coordinates.map((c) => {
          const levels = Array.from({ length: 10 }, (_, idx) => idx + 1);
          return levels.map((L) => {
            const xNode = cx + (L / 10) * R * Math.cos(c.rad);
            const yNode = cy + (L / 10) * R * Math.sin(c.rad);

            const offset = 6;
            const perpRad = c.rad + Math.PI / 2;
            const nx = cx + (L / 10) * R * Math.cos(c.rad) + offset * Math.cos(perpRad);
            const ny = cy + (L / 10) * R * Math.sin(c.rad) + offset * Math.sin(perpRad);

            const isCurrentScore = (formData[c.key] ?? 5) === L;

            return (
              <g key={`${c.key}-${L}`} className="group">
                <text
                  x={nx}
                  y={ny + 2}
                  fill={isCurrentScore ? "#818cf8" : "rgba(255, 255, 255, 0.18)"}
                  fontSize="5.5px"
                  fontWeight={isCurrentScore ? "800" : "500"}
                  textAnchor="middle"
                  className="cursor-pointer select-none transition-colors duration-150 group-hover:fill-indigo-400"
                  onClick={() => handleRadarClick(c.key, L)}
                >
                  {L}
                </text>

                <circle
                  cx={xNode}
                  cy={yNode}
                  r="7"
                  fill="transparent"
                  className="cursor-pointer hover:fill-indigo-500/10 transition-colors"
                  onClick={() => handleRadarClick(c.key, L)}
                />
              </g>
            );
          });
        })}

        {/* Outer labels & glowing score points */}
        {coordinates.map((c, i) => {
          const labelDist = R + 18;
          const lx = cx + labelDist * Math.cos(c.rad);
          const ly = cy + labelDist * Math.sin(c.rad);

          let textAnchor: "middle" | "start" | "end" = "middle";
          if (Math.cos(c.rad) > 0.1) textAnchor = "start";
          else if (Math.cos(c.rad) < -0.1) textAnchor = "end";

          return (
            <g key={i}>
              <circle
                cx={c.xScore}
                cy={c.yScore}
                r="4.5"
                fill="#818cf8"
                className="transition-all duration-300 filter drop-shadow-[0_0_4px_#818cf8]"
              />
              <text
                x={lx}
                y={ly + 4}
                fill="rgba(220, 220, 220, 0.85)"
                fontSize="8px"
                fontWeight="700"
                textAnchor={textAnchor}
                className="font-sans select-none tracking-tight"
              >
                {c.label}
              </text>
            </g>
          );
        })}

        {/* Active click pulse animation */}
        {lastClickedPoint && (() => {
          const targetCoord = coordinates.find(c => c.key === lastClickedPoint.key);
          if (!targetCoord) return null;

          const px = cx + (lastClickedPoint.value / 10) * R * Math.cos(targetCoord.rad);
          const py = cy + (lastClickedPoint.value / 10) * R * Math.sin(targetCoord.rad);

          return (
            <circle
              key={lastClickedPoint.time}
              cx={px}
              cy={py}
              className="radar-pulse-ring"
            />
          );
        })()}
      </svg>
    );
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStep(1);
    setFormData(initialData);
    setAiReport("");
    setActiveTab("ai");
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-900/20 glow-blur"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-900/20 glow-blur"></div>

      <header className="relative z-10 w-full px-6 py-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/LOGOS.png"
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
            Diagnóstico Automotivo
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto">
          {isLoadingAI ? (
            <div className="glass-panel animate-fade-in rounded-3xl p-8 sm:p-16 shadow-2xl shadow-black/80 flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <div className="absolute h-12 w-12 rounded-full bg-indigo-500/10 blur-xl animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">Análise Estratégica em Andamento</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto animate-pulse">{loadingStepText}</p>
              </div>
            </div>
          ) : !isSubmitted ? (
            <div className="glass-panel animate-fade-in rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80">
              {/* Progress Stepper Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-3">
                  <span>Passo {step} de 3</span>
                  <span>{step === 1 ? "Identificação" : step === 2 ? "Desempenho Comercial" : "Marketing & Canais"}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Form container */}
              <form onSubmit={(e) => { e.preventDefault(); if (step === 3) { handleSubmit(e); } }} className="space-y-6">
                {/* STEP 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Vamos começar a sua análise</h2>
                      <p className="text-sm text-zinc-400 mt-1">Preencha os dados básicos da concessionária ou loja de veículos.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="nomeLoja">Nome da Loja</label>
                        <input
                          id="nomeLoja"
                          type="text"
                          placeholder="Ex: Auto Prime Multimarcas"
                          value={formData.nomeLoja}
                          onChange={(e) => handleInputChange("nomeLoja", e.target.value)}
                          className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                        />
                        {errors.nomeLoja && <p className="text-xs font-semibold text-red-500 mt-1">{errors.nomeLoja}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="nomeResponsavel">Nome do Responsável</label>
                        <input
                          id="nomeResponsavel"
                          type="text"
                          placeholder="Ex: João da Silva"
                          value={formData.nomeResponsavel}
                          onChange={(e) => handleInputChange("nomeResponsavel", e.target.value)}
                          className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                        />
                        {errors.nomeResponsavel && <p className="text-xs font-semibold text-red-500 mt-1">{errors.nomeResponsavel}</p>}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="contato">Contato (WhatsApp)</label>
                        <input
                          id="contato"
                          type="text"
                          placeholder="Ex: (11) 99999-9999"
                          value={formData.contato}
                          onChange={(e) => handleInputChange("contato", e.target.value)}
                          className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                        />
                        {errors.contato && <p className="text-xs font-semibold text-red-500 mt-1">{errors.contato}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Sales Metrics */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Desempenho Comercial</h2>
                      <p className="text-sm text-zinc-400 mt-1">Insira a quantidade média de carros negociados por mês.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="mediaVendas">Média de Vendas (últimos meses)</label>
                        <div className="relative">
                          <input
                            id="mediaVendas"
                            type="number"
                            min="0"
                            placeholder="Ex: 35"
                            value={formData.mediaVendas}
                            onChange={(e) => handleInputChange("mediaVendas", e.target.value)}
                            className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 pl-4 pr-24 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs font-semibold text-zinc-500 bg-zinc-800/80 px-2 py-1 rounded">carros/mês</span>
                          </div>
                        </div>
                        {errors.mediaVendas && <p className="text-xs font-semibold text-red-500 mt-1">{errors.mediaVendas}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="metaVendas">Meta de Vendas</label>
                        <div className="relative">
                          <input
                            id="metaVendas"
                            type="number"
                            min="0"
                            placeholder="Ex: 50"
                            value={formData.metaVendas}
                            onChange={(e) => handleInputChange("metaVendas", e.target.value)}
                            className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 pl-4 pr-24 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs font-semibold text-zinc-500 bg-zinc-800/80 px-2 py-1 rounded">carros/mês</span>
                          </div>
                        </div>
                        {errors.metaVendas && <p className="text-xs font-semibold text-red-500 mt-1">{errors.metaVendas}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Marketing & Setup */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Marketing & Estrutura Comercial</h2>
                      <p className="text-sm text-zinc-400 mt-1">Configuração de canais, investimentos e tecnologias adotadas.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* IA e SDR Yes/No options with beautiful radio grids */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-zinc-300">Tem Inteligência Artificial no Atendimento?</span>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => handleInputChange("temIA", "sim")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.temIA === "sim" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange("temIA", "nao")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.temIA === "nao" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm font-medium text-zinc-300">Tem Pré-Vendas / SDR?</span>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => handleInputChange("temPreVendas", "sim")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.temPreVendas === "sim" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange("temPreVendas", "nao")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.temPreVendas === "nao" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      {/* Tráfego Pago Toggle */}
                      <div className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium text-zinc-300">Faz Tráfego Pago (Anúncios no Meta/Google)?</span>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => handleInputChange("fazTrafego", "sim")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.fazTrafego === "sim" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Sim, investimos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange("fazTrafego", "nao")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.fazTrafego === "nao" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Não fazemos tráfego
                          </button>
                        </div>
                      </div>

                      {/* Condicionais de tráfego */}
                      {formData.fazTrafego === "sim" && (
                        <>
                          <div className="space-y-2 animate-fade-in">
                            <label className="text-sm font-medium text-zinc-300" htmlFor="investimentoTrafego">Quanto investe em tráfego pago (mensal)?</label>
                            <input
                              id="investimentoTrafego"
                              type="text"
                              placeholder="R$ 0,00"
                              value={formData.investimentoTrafego}
                              onChange={(e) => handleInputChange("investimentoTrafego", e.target.value)}
                              className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                            />
                            {errors.investimentoTrafego && <p className="text-xs font-semibold text-red-500 mt-1">{errors.investimentoTrafego}</p>}
                          </div>

                          <div className="space-y-2 animate-fade-in">
                            <label className="text-sm font-medium text-zinc-300" htmlFor="carrosTrafego">Quantos carros vende por tráfego rastreado?</label>
                            <input
                              id="carrosTrafego"
                              type="number"
                              min="0"
                              placeholder="Ex: 8"
                              value={formData.carrosTrafego}
                              onChange={(e) => handleInputChange("carrosTrafego", e.target.value)}
                              className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                            />
                            {errors.carrosTrafego && <p className="text-xs font-semibold text-red-500 mt-1">{errors.carrosTrafego}</p>}
                          </div>
                        </>
                      )}

                      {/* Portais */}
                      <div className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium text-zinc-300">Anuncia em Portais Automotivos (Webmotors, OLX, iCarros, etc.)?</span>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => handleInputChange("fazPortais", "sim")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.fazPortais === "sim" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange("fazPortais", "nao")}
                            className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] ${formData.fazPortais === "nao" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20" : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      {/* Investimento Marketing Total */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="investimentoMarketing">Quanto investe em marketing total mensal (tráfego + portais + outros)?</label>
                        <input
                          id="investimentoMarketing"
                          type="text"
                          placeholder="R$ 0,00"
                          value={formData.investimentoMarketing}
                          onChange={(e) => handleInputChange("investimentoMarketing", e.target.value)}
                          className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-offset-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                        />
                        {errors.investimentoMarketing && <p className="text-xs font-semibold text-red-500 mt-1">{errors.investimentoMarketing}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Roda de Diagnóstico Nova Era */}
                {step === 4 && (
                  <div className="space-y-8 animate-fade-in flex flex-col items-center">
                    <div className="text-center w-full">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Autoavaliação: Diagnóstico Nova Era</h2>
                      <p className="text-sm text-zinc-400 mt-1">Preencha as notas de 1 a 10 para cada um dos eixos abaixo. O gráfico de radar ao lado se atualizará automaticamente.</p>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      {/* Left Column: Number Inputs Grid */}
                      <div className="grid grid-cols-1 gap-2.5 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar p-1">
                        {eixos.map((eixo) => {
                          const val = formData[eixo.key];
                          return (
                            <div key={eixo.key} className="space-y-1.5 bg-zinc-900/20 border border-zinc-900/80 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4">
                              <label htmlFor={eixo.key} className="text-xs font-semibold text-zinc-300 leading-tight w-1/2">
                                {eixo.label}
                              </label>
                              <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = typeof val === "number" ? val : 5;
                                    const nextVal = Math.max(1, current - 1);
                                    handleInputChange(eixo.key, nextVal);
                                    setLastClickedPoint({
                                      key: eixo.key,
                                      value: nextVal,
                                      time: Date.now(),
                                    });
                                  }}
                                  className="h-7 w-7 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 transition-all flex items-center justify-center font-bold text-base cursor-pointer select-none"
                                >
                                  -
                                </button>
                                <div className="flex items-center">
                                  <input
                                    id={eixo.key}
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={val}
                                    onChange={(e) => {
                                      const rawVal = e.target.value;
                                      if (rawVal === "") {
                                        handleInputChange(eixo.key, "");
                                        return;
                                      }
                                      let numVal = parseInt(rawVal);
                                      if (!isNaN(numVal)) {
                                        if (numVal > 10) numVal = 10;
                                        if (numVal < 0) numVal = 0;
                                        handleInputChange(eixo.key, numVal);
                                        setLastClickedPoint({
                                          key: eixo.key,
                                          value: numVal,
                                          time: Date.now(),
                                        });
                                      }
                                    }}
                                    onBlur={(e) => {
                                      let numVal = parseInt(e.target.value);
                                      if (isNaN(numVal) || numVal < 1) {
                                        handleInputChange(eixo.key, 1);
                                        setLastClickedPoint({
                                          key: eixo.key,
                                          value: 1,
                                          time: Date.now(),
                                        });
                                      }
                                    }}
                                    className="w-8 text-center bg-transparent border-0 text-indigo-400 font-extrabold outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-[10px] text-zinc-600 font-bold pr-1 select-none">/10</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = typeof val === "number" ? val : 5;
                                    const nextVal = Math.min(10, current + 1);
                                    handleInputChange(eixo.key, nextVal);
                                    setLastClickedPoint({
                                      key: eixo.key,
                                      value: nextVal,
                                      time: Date.now(),
                                    });
                                  }}
                                  className="h-7 w-7 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 transition-all flex items-center justify-center font-bold text-base cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Static SVG Radar Box */}
                      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden min-h-[440px]">
                        {/* Glow blur background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[280px] w-[280px] rounded-full bg-indigo-500/5 blur-3xl"></div>

                        <div className="text-center mb-4 relative z-10">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">Diagnóstico</span>
                          <h3 className="text-lg font-black text-white tracking-tighter uppercase mt-1">Nova Era</h3>
                        </div>

                        <div className="flex items-center justify-center w-full overflow-x-auto py-2">
                          {renderRadarChart(320, false)}
                        </div>

                        {/* Supporter logos */}
                        <div className="flex flex-col items-center justify-center gap-1.5 mt-4 pt-3 border-t border-zinc-900/60 w-full relative z-10">
                          <img
                            src="/LOGOS.png"
                            alt="AEG Media & C6Auto"
                            className="h-6 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-6 border-t border-zinc-900/80">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:text-white font-semibold hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] transition-all duration-200 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Voltar
                    </button>
                  ) : (
                    <div className="hidden sm:block"></div>
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] transition-all duration-200 cursor-pointer"
                    >
                      Avançar
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] transition-all duration-300 cursor-pointer"
                    >
                      Gerar Diagnóstico
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* RESULTS DASHBOARD */
            <div className="space-y-8 animate-fade-in">
              {/* Header result */}
              <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left space-y-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-900/50 uppercase tracking-wider">Diagnóstico Concluído</span>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">{formData.nomeLoja}</h1>
                  <p className="text-sm text-zinc-400">Responsável: <span className="text-zinc-200 font-semibold">{formData.nomeResponsavel}</span> | Contato: <span className="text-zinc-200 font-semibold">{formData.contato}</span></p>
                </div>
                <div className="flex flex-col items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-6 py-4 rounded-2xl w-full md:w-auto">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Maturidade Digital</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-indigo-400">{scoreMaturidade}</span>
                    <span className="text-xl font-bold text-zinc-500">/100</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getMaturidadeBadge(scoreMaturidade).color}`}>
                    {getMaturidadeBadge(scoreMaturidade).label}
                  </span>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-zinc-800 bg-zinc-900/10 rounded-t-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 text-center py-3 px-2 sm:py-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all duration-200 hover:bg-zinc-900/10 hover:text-zinc-200 active:scale-[0.99] cursor-pointer ${activeTab === "ai"
                    ? "border-indigo-500 text-indigo-400 bg-zinc-900/30"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  🎯 Plano de Ação (IA Gemini)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("metrics")}
                  className={`flex-1 text-center py-3 px-2 sm:py-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all duration-200 hover:bg-zinc-900/10 hover:text-zinc-200 active:scale-[0.99] cursor-pointer ${activeTab === "metrics"
                    ? "border-indigo-500 text-indigo-400 bg-zinc-900/30"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  📊 Métricas & Análise Geral
                </button>
              </div>

              {/* TAB 1: AI PLAN OF ACTION */}
              {activeTab === "ai" && (
                <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Plano de Ação Estratégico IA</h2>
                      <p className="text-xs text-zinc-400 mt-1">Plano estruturado em 5 pontos prioritários para alavancar suas vendas.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-xs font-bold text-zinc-300 hover:text-white hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Copiado!
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copiar Relatório
                        </>
                      )}
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none text-zinc-300 space-y-4">
                    {renderMarkdownText(aiReport)}
                  </div>

                  {/* Dashboard Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-zinc-900/80">


                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setStep(1);
                        setFormData(initialData);
                        setAiReport("");
                        setActiveTab("ai");
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:text-white py-4 px-6 font-bold hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] transition-all duration-200 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                      </svg>
                      Novo Diagnóstico
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: METRICS & TRADITIONAL RECOMMENDATIONS */}
              {activeTab === "metrics" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">

                  {/* Left Column: Metrics & Recommendations */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Metric 1: Sales status */}
                      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-zinc-400">Vendas vs Meta</span>
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-white">{mediaVendasNum}</span>
                              <span className="text-zinc-500 text-sm">/ {metaVendasNum} carros</span>
                            </div>
                            <p className="text-xs text-zinc-400">Vendas médias mensais atuais.</p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                            <span>Atingimento da Meta</span>
                            <span>{metaVendasNum > 0 ? Math.round((mediaVendasNum / metaVendasNum) * 100) : 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, metaVendasNum > 0 ? (mediaVendasNum / metaVendasNum) * 100 : 0)}%` }}
                            ></div>
                          </div>
                          {gapVendas > 0 ? (
                            <p className="text-xs font-semibold text-amber-500 mt-2 flex items-center gap-1">
                              Faltam {gapVendas} carros para a meta
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                              Meta atingida ou superada! 🎉
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Metric 2: CAC */}
                      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-zinc-400">CAC do Tráfego</span>
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-3xl font-bold text-white">
                              {formData.fazTrafego === "sim" && cacTrafego > 0
                                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cacTrafego)
                                : "N/A"}
                            </span>
                            <p className="text-xs text-zinc-400">Custo de Aquisição por Veículo no tráfego.</p>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-zinc-900/60">
                          <span className="text-xs text-zinc-500 font-semibold block mb-1">Status de Custo</span>
                          {formData.fazTrafego === "nao" ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400">Sem tráfego ativo</span>
                          ) : cacTrafego < 400 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40">Excelente Eficiência</span>
                          ) : cacTrafego < 800 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/40">Saudável</span>
                          ) : cacTrafego < 1500 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900/40">Atenção / Otimizar</span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900/40">Crítico / CAC Alto</span>
                          )}
                        </div>
                      </div>

                      {/* Metric 3: Marketing vs Vendas */}
                      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-zinc-400">Mkt por Venda</span>
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-3xl font-bold text-white">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(marketingPorCarro)}
                            </span>
                            <p className="text-xs text-zinc-400">Investimento total de marketing / carro vendido.</p>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-zinc-900/60">
                          <span className="text-xs text-zinc-500 font-semibold block mb-1">Eficiência de Tráfego</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300">
                            {formData.fazTrafego === "sim"
                              ? `${Math.round(eficienciaTrafego)}% das vendas vêm do tráfego`
                              : "Sem tráfego pago"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Recomendações Estratégicas Gerais</h2>
                        <p className="text-sm text-zinc-400 mt-1">Ações baseadas puramente nas respostas do seu formulário.</p>
                      </div>

                      <div className="space-y-4">
                        {getRecommendations().map((rec, index) => (
                          <div key={index} className="flex gap-4 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900/80 hover:border-zinc-800 transition-all duration-200">
                            <div className="mt-0.5 flex-shrink-0">
                              {rec.status === "warning" && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/80 border border-amber-900 text-amber-400">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                              )}
                              {rec.status === "success" && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-900 text-emerald-400">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {rec.status === "info" && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950/80 border border-blue-900 text-blue-400">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-white text-base">{rec.title}</h3>
                              <p className="text-sm text-zinc-400 leading-relaxed">{rec.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Roda do Diagnóstico visual recap */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden min-h-[380px] lg:col-span-1">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full bg-indigo-500/5 blur-xl"></div>

                    <div className="text-center mb-4 relative z-10">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">Autoavaliação</span>
                      <h3 className="text-lg font-black text-white tracking-tighter uppercase mt-1">Diagnóstico Nova Era</h3>
                    </div>

                    {renderRadarChart(250)}

                    <div className="flex flex-col items-center justify-center gap-1.5 mt-6 pt-3 border-t border-zinc-900/60 w-full relative z-10">
                      <img
                        src="/LOGOS.png"
                        alt=" AEG Media & C6Auto"
                        className="h-6 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                      />
                    </div>
                  </div>

                  {/* Actions under columns */}
                  <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4 pt-6 border-t border-zinc-900/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setStep(1);
                        setFormData(initialData);
                        setAiReport("");
                        setActiveTab("ai");
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:text-white py-4 px-6 font-bold hover:scale-[1.02] active:scale-[0.96] active:translate-y-[0.5px] transition-all duration-200 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                      </svg>
                      Novo Diagnóstico
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>


    </div>
  );
}

