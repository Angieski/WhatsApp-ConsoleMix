export interface Plan {
  id: string;
  name: string;
  price: string;
  agents: string;
  conversations: string;
  highlights: string[];
}

export const PLANS: Plan[] = [];

export function formatCatalog(): string {
  return "Informações sobre planos e preços ainda não disponíveis. Entre em contato com nosso suporte: (42) 99985-3754 ou (42) 99848-8284, de segunda a sexta das 9h às 18h.";
}
