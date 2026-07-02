import { getSettings } from "../services/settingsService";

const ZAPI_BASE = "https://api.z-api.io";

interface SendTextResponse {
  zaapId: string;
  messageId: string;
  id: string;
}

export async function sendText(phone: string, message: string): Promise<SendTextResponse> {
  const { instanceId, token, clientToken } = await getSettings();
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": clientToken,
    },
    body: JSON.stringify({ phone, message }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Z-API send-text falhou [${response.status}]: ${body}`);
  }

  return response.json() as Promise<SendTextResponse>;
}
