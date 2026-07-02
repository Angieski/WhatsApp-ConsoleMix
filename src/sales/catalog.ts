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
    id: "starter",
    name: "Starter",
    price: "R$ 99/mês",
    agents: "até 2 atendentes",
    conversations: "500 conversas/mês",
    highlights: [
      "Relatórios básicos",
      "Suporte por e-mail",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "R$ 299/mês",
    agents: "até 10 atendentes",
    conversations: "conversas ilimitadas",
    highlights: [
      "Relatórios avançados e exportação",
      "Integrações com CRM (HubSpot, RD Station)",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "sob consulta",
    agents: "atendentes ilimitados",
    conversations: "conversas ilimitadas",
    highlights: [
      "SLA garantido 99,9%",
      "Suporte dedicado 24/7",
      "Personalização completa de fluxos",
      "Gerente de conta exclusivo",
    ],
  },
];

export function formatCatalog(): string {
  return PLANS.map((p) => {
    const highlights = p.highlights.map((h) => `  • ${h}`).join("\n");
    return `*${p.name}* — ${p.price}\n${p.agents} | ${p.conversations}\n${highlights}`;
  }).join("\n\n");
}
