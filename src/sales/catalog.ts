export interface Plan {
  id: string;
  name: string;
  price: string;
  agents: string;
  conversations: string;
  highlights: string[];
}

export const PLANS: Plan[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: "R$ 197/mês",
    agents: "1 instalação",
    conversations: "uso individual",
    highlights: [
      "Até 8 canais de áudio",
      "Barramentos A, B e Minus",
      "Suporte por e-mail",
      "Atualizações inclusas",
    ],
  },
  {
    id: "profissional",
    name: "Profissional",
    price: "R$ 397/mês",
    agents: "2 instalações",
    conversations: "uso profissional",
    highlights: [
      "16 canais de áudio completos",
      "Todos os barramentos (A, B, C e Minus)",
      "Audio Call incluso",
      "Integração vMix",
      "Suporte prioritário",
    ],
  },
  {
    id: "broadcast",
    name: "Broadcast",
    price: "R$ 697/mês",
    agents: "instalações ilimitadas",
    conversations: "uso comercial/emissoras",
    highlights: [
      "Todos os recursos do Profissional",
      "Licença para múltiplos computadores",
      "Suporte dedicado e treinamento",
      "SLA garantido",
    ],
  },
];

export function formatCatalog(): string {
  return PLANS.map((p) => {
    const highlights = p.highlights.map((h) => `  • ${h}`).join("\n");
    return `*${p.name}* — ${p.price}\n${p.agents} | ${p.conversations}\n${highlights}`;
  }).join("\n\n");
}
