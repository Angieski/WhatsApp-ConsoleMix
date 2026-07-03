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
const MAX_TOOL_ROUNDS = 5;

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

    console.log(
      `[claudeClient] round=${round} stop_reason=${response.stop_reason} ` +
      `blocks=${response.content.map((b) => b.type).join(",")}`
    );

    const hasToolUse = response.content.some((b) => b.type === "tool_use");
    if (!hasToolUse) {
      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock?.type === "text" ? textBlock.text.trim() : "";
      if (text) return text;
      console.warn(`[claudeClient] Resposta vazia no round ${round} — retentando`);
      continue;
    }

    workingMessages.push({ role: "assistant", content: response.content });

    const toolResults: ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        console.log(`[claudeClient] Executando ferramenta: ${block.name}`);
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

  // Loop esgotado — faz uma chamada final com o histórico original (sem tool exchange)
  // e sem ferramentas, forçando resposta em texto puro
  console.warn(`[claudeClient] Loop de ferramentas esgotado — tentativa final sem tools`);
  const finalResponse = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages: history,
  });

  const finalText = finalResponse.content.find((b) => b.type === "text");
  const text = finalText?.type === "text" ? finalText.text.trim() : "";
  if (text) return text;

  return "Desculpe, não consegui processar sua solicitação. Por favor, tente novamente.";
}
