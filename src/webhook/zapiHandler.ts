import { Request, Response } from "express";
import { getHistory, appendToHistory } from "../session/sessionManager";
import { generateReply } from "../ai/claudeClient";
import { retrieveContext } from "../rag/retriever";
import { sendText } from "../zapi/zapiClient";
import { getSettings } from "../services/settingsService";
import { upsertConversation } from "../services/conversationService";

interface ZapiWebhookPayload {
  type: string;
  fromMe: boolean;
  isGroup: boolean;
  phone: string;
  instanceId: string;
  messageId: string;
  senderName?: string;
  text?: { message: string };
}

const processedIds = new Set<string>();

export async function handleIncoming(req: Request, res: Response): Promise<void> {
  const payload = req.body as ZapiWebhookPayload;

  res.sendStatus(200);

  // Verifica se o bot está habilitado
  const settings = await getSettings();
  if (!settings.enabled) return;

  if (
    payload.type !== "ReceivedCallback" ||
    payload.fromMe ||
    payload.isGroup ||
    !payload.text?.message
  ) {
    return;
  }

  if (processedIds.has(payload.messageId)) return;
  processedIds.add(payload.messageId);
  if (processedIds.size > 500) {
    const [first] = processedIds;
    processedIds.delete(first);
  }

  const phone = payload.phone;
  const incomingText = payload.text.message.trim();

  // Registra/atualiza a conversa no dashboard
  await upsertConversation(phone, payload.senderName);

  try {
    await appendToHistory(phone, "user", incomingText);

    const [history, ragContext] = await Promise.all([
      getHistory(phone),
      retrieveContext(incomingText),
    ]);

    const reply = await generateReply(history, ragContext, phone);
    await appendToHistory(phone, "assistant", reply);

    await sendText(phone, reply);
  } catch (err) {
    console.error(`[zapiHandler] Erro ao processar mensagem de ${phone}:`, err);

    try {
      await sendText(phone, "Desculpe, ocorreu um erro interno. Tente novamente em instantes.");
    } catch (sendErr) {
      console.error("[zapiHandler] Falha ao enviar mensagem de erro:", sendErr);
    }
  }
}
