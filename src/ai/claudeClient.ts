import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { SYSTEM_PROMPT } from "../knowledge/faq";
import { SALES_TOOLS, executeTool } from "../sales/tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 5; // evita loops infinitos

export async function generateReply(
  history: MessageParam[],
  ragContext: string = "",
  phone: string = ""
): Promise<string> {
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (ragContext) {
    systemBlocks.push({
      type: "text",
      text: `## Contexto relevante da base de conhecimento\n\n${ragContext}`,
      cache_control: { type: "ephemeral" },
    });
  }

  // Cópia mutável — as trocas de tool use ficam aqui mas não poluem o histórico do banco
  const workingMessages: MessageParam[] = [...history];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks,
      messages: workingMessages,
      tools: SALES_TOOLS,
    });

    // Sem tool use: retorna o texto final
    if (
      response.stop_reason === "end_turn" ||
      !response.content.some((b) => b.type === "tool_use")
    ) {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.type === "text" ? textBlock.text : "";
    }

    // Adiciona a resposta do assistente (com blocos tool_use) ao histórico de trabalho
    workingMessages.push({ role: "assistant", content: response.content });

    // Executa cada ferramenta solicitada
    const toolResults: ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const result = await executeTool(
          block.name,
          block.input as Record<string, string>,
          phone
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    workingMessages.push({ role: "user", content: toolResults });
  }

  return "Desculpe, não consegui processar sua solicitação. Por favor, tente novamente.";
}
