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

// Aguarda este tempo após a última mensagem antes de processar
const DEBOUNCE_MS = 4000;

const processedIds = new Set<string>();

interface MessageBuffer {
  parts: string[];
  senderName?: string;
  timer: ReturnType<typeof setTimeout>;
}

const buffers    = new Map<string, MessageBuffer>();
const processing = new Set<string>(); // evita processamento duplo do mesmo número

async function processBuffer(phone: string): Promise<void> {
  // Se já está processando este número, reagenda para depois do processamento atual
  if (processing.has(phone)) {
    setTimeout(() => processBuffer(phone), DEBOUNCE_MS);
    return;
  }

  const buf = buffers.get(phone);
  if (!buf) return;
  buffers.delete(phone);

  processing.add(phone);

  const combinedText = buf.parts.join("\n\n");

  try {
    await appendToHistory(phone, "user", combinedText);

    const [history, ragContext] = await Promise.all([
      getHistory(phone),
      retrieveContext(combinedText),
    ]);

    const reply = await generateReply(history, ragContext, phone);

    if (!reply.trim()) {
      console.warn(`[zapiHandler] generateReply retornou vazio para ${phone} — nada enviado`);
      return;
    }

    // Envia primeiro — só persiste no histórico após entrega confirmada
    await sendText(phone, reply);
    await appendToHistory(phone, "assistant", reply);
  } catch (err) {
    console.error(`[zapiHandler] Erro ao processar mensagem de ${phone}:`, err);

    try {
      await sendText(phone, "Desculpe, ocorreu um erro interno. Tente novamente em instantes.");
    } catch (sendErr) {
      console.error("[zapiHandler] Falha ao enviar mensagem de erro:", sendErr);
    }
  } finally {
    processing.delete(phone);
  }
}

export async function handleIncoming(req: Request, res: Response): Promise<void> {
  const payload = req.body as ZapiWebhookPayload;

  res.sendStatus(200);

  try {
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

    // Registra/atualiza a conversa no dashboard imediatamente
    await upsertConversation(phone, payload.senderName);

    const existing = buffers.get(phone);
    if (existing) {
      // Reagrupa com a mensagem anterior e reinicia o timer
      clearTimeout(existing.timer);
      existing.parts.push(incomingText);
      existing.timer = setTimeout(() => processBuffer(phone), DEBOUNCE_MS);
      console.log(`[zapiHandler] Buffer ${phone}: ${existing.parts.length} partes acumuladas`);
    } else {
      // Inicia novo buffer para este número
      const timer = setTimeout(() => processBuffer(phone), DEBOUNCE_MS);
      buffers.set(phone, { parts: [incomingText], senderName: payload.senderName, timer });
    }
  } catch (err) {
    console.error("[zapiHandler] Erro ao registrar mensagem de", payload.phone, ":", err);
  }
}
