import { pool } from "../db/pool";

export interface BotSettings {
  enabled: boolean;
  instanceId: string;
  token: string;
  clientToken: string;
  phoneDisplay: string;
}

interface SettingsRow {
  enabled: boolean;
  instance_id: string | null;
  token: string | null;
  client_token: string | null;
  phone_display: string | null;
}

let cache: { settings: BotSettings; expiry: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getSettings(): Promise<BotSettings> {
  if (cache && Date.now() < cache.expiry) return cache.settings;

  const { rows } = await pool.query<SettingsRow>(
    "SELECT enabled, instance_id, token, client_token, phone_display FROM bot_settings WHERE id = 1"
  );

  const row = rows[0];
  const settings: BotSettings = {
    enabled: Boolean(row.enabled), // SQLite retorna 0/1; PostgreSQL retorna boolean
    instanceId: row.instance_id ?? process.env.ZAPI_INSTANCE_ID ?? "",
    token: row.token ?? process.env.ZAPI_TOKEN ?? "",
    clientToken: row.client_token ?? process.env.ZAPI_CLIENT_TOKEN ?? "",
    phoneDisplay: row.phone_display ?? "",
  };

  cache = { settings, expiry: Date.now() + CACHE_TTL_MS };
  return settings;
}

export async function updateSettings(patch: Partial<BotSettings>): Promise<BotSettings> {
  const fields: string[] = [];
  const values: (string | boolean)[] = [];
  let idx = 1;

  if (patch.enabled !== undefined) { fields.push(`enabled = $${idx++}`); values.push(patch.enabled); }
  if (patch.instanceId !== undefined) { fields.push(`instance_id = $${idx++}`); values.push(patch.instanceId); }
  if (patch.token !== undefined) { fields.push(`token = $${idx++}`); values.push(patch.token); }
  if (patch.clientToken !== undefined) { fields.push(`client_token = $${idx++}`); values.push(patch.clientToken); }
  if (patch.phoneDisplay !== undefined) { fields.push(`phone_display = $${idx++}`); values.push(patch.phoneDisplay); }

  if (fields.length === 0) return getSettings();

  fields.push(`updated_at = NOW()`);
  await pool.query(
    `UPDATE bot_settings SET ${fields.join(", ")} WHERE id = 1`,
    values
  );

  cache = null; // invalida cache
  return getSettings();
}
