import { getSettings } from "../services/settingsService";

const ZAPI_BASE = "https://api.z-api.io";
const DELAY_BETWEEN_PARTS_MS = 1200;

interface SendTextResponse {
  zaapId: string;
  messageId: string;
  id: string;
}

function formatForWhatsApp(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "*$1*")          // **bold** → *bold*
    .replace(/^#{1,3}\s+(.+)$/gm, "*$1*")        // ## Título → *Título*
    .replace(/^[-*]\s+/gm, "• ")                  // - item → • item
    .replace(/\n{3,}/g, "\n\n")                   // excesso de linhas em branco
    .trim();
}

function splitIntoParts(text: string): string[] {
  const parts = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const result: string[] = [];
  for (const part of parts) {
    if (part.length <= 600) {
      result.push(part);
    } else {
      // Quebra partes longas em sentenças
      const sentences = part.match(/[^.!?]+[.!?]+/g) ?? [part];
      let chunk = "";
      for (const sentence of sentences) {
        if ((chunk + sentence).length > 600 && chunk) {
          result.push(chunk.trim());
          chunk = sentence;
        } else {
          chunk += sentence;
        }
      }
      if (chunk.trim()) result.push(chunk.trim());
    }
  }
  return result.length > 0 ? result : [text];
}

async function sendSingleText(
  phone: string,
  message: string,
  instanceId: string,
  token: string,
  clientToken: string
): Promise<SendTextResponse> {
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/send-text`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Token": clientToken },
    body: JSON.stringify({ phone, message }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Z-API send-text falhou [${response.status}]: ${body}`);
  }
  return response.json() as Promise<SendTextResponse>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SEND_RETRIES    = 3;
const SEND_RETRY_BASE = 2000; // 2 s, 4 s

async function sendSingleTextWithRetry(
  phone: string,
  message: string,
  instanceId: string,
  token: string,
  clientToken: string
): Promise<SendTextResponse> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < SEND_RETRIES; attempt++) {
    try {
      return await sendSingleText(phone, message, instanceId, token, clientToken);
    } catch (err) {
      lastErr = err;
      // Não retenta erros 4xx (credenciais inválidas, número inexistente, etc.)
      if (err instanceof Error && /\[4\d\d\]/.test(err.message)) throw err;
      if (attempt < SEND_RETRIES - 1) {
        console.warn(`[zapiClient] Tentativa ${attempt + 1} falhou — retentando em ${SEND_RETRY_BASE * (attempt + 1)}ms`);
        await delay(SEND_RETRY_BASE * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

export async function sendText(phone: string, message: string): Promise<SendTextResponse> {
  const { instanceId, token, clientToken } = await getSettings();
  const formatted = formatForWhatsApp(message);
  const parts = splitIntoParts(formatted).filter((p) => p.trim().length > 0);

  if (parts.length === 0) {
    throw new Error("sendText: mensagem resultou em conteúdo vazio após formatação");
  }

  let last!: SendTextResponse;
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) await delay(DELAY_BETWEEN_PARTS_MS);
    last = await sendSingleTextWithRetry(phone, parts[i], instanceId, token, clientToken);
  }
  return last;
}
