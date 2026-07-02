import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { createOrder } from "./orderService";
import { formatCatalog } from "./catalog";

export const SALES_TOOLS: Tool[] = [
  {
    name: "register_order",
    description:
      "Registra o pedido do cliente no sistema. Use esta ferramenta somente quando tiver coletado TODOS os dados obrigatórios: nome completo, e-mail, plano escolhido. Empresa/segmento é opcional.",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_name: {
          type: "string",
          description: "Nome completo do cliente",
        },
        customer_email: {
          type: "string",
          description: "E-mail do cliente para envio da confirmação",
        },
        company: {
          type: "string",
          description: "Nome da empresa ou segmento de atuação (opcional)",
        },
        product: {
          type: "string",
          description: "Plano escolhido: Starter, Business ou Enterprise",
        },
      },
      required: ["customer_name", "customer_email", "product"],
    },
  },
  {
    name: "get_catalog",
    description:
      "Retorna o catálogo atualizado de planos e preços. Use quando o cliente perguntar sobre planos, preços ou quiser comparar opções.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

interface RegisterOrderInput {
  customer_name: string;
  customer_email: string;
  company?: string;
  product: string;
}

export async function executeTool(
  toolName: string,
  input: Record<string, string>,
  phone: string
): Promise<string> {
  switch (toolName) {
    case "register_order": {
      const args = input as unknown as RegisterOrderInput;
      const order = await createOrder({
        phone,
        customerName: args.customer_name,
        customerEmail: args.customer_email,
        company: args.company,
        product: args.product,
      });
      return JSON.stringify({
        success: true,
        orderId: order.id,
        message: `Pedido #${order.id} registrado com sucesso para ${args.customer_name}.`,
      });
    }

    case "get_catalog":
      return formatCatalog();

    default:
      return JSON.stringify({ success: false, error: `Ferramenta desconhecida: ${toolName}` });
  }
}
