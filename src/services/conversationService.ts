import { pool } from "../db/pool";

export interface Conversation {
  phone: string;
  customerName: string | null;
  tag: "suporte" | "venda";
  status: "pendente" | "concluido";
  lastMessageAt: Date;
  createdAt: Date;
  lastMessage?: string;
}

export interface ConversationFilter {
  tag?: "suporte" | "venda";
  status?: "pendente" | "concluido";
}

export async function upsertConversation(
  phone: string,
  customerName?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO conversations (phone, customer_name, last_message_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (phone) DO UPDATE SET
       last_message_at = NOW(),
       customer_name = COALESCE(excluded.customer_name, conversations.customer_name)`,
    [phone, customerName ?? null]
  );
}

export async function updateConversation(
  phone: string,
  patch: { tag?: string; status?: string; customerName?: string }
): Promise<Conversation | null> {
  const fields: string[] = [];
  const values: string[] = [];
  let idx = 1;

  if (patch.tag) { fields.push(`tag = $${idx++}`); values.push(patch.tag); }
  if (patch.status) { fields.push(`status = $${idx++}`); values.push(patch.status); }
  if (patch.customerName) { fields.push(`customer_name = $${idx++}`); values.push(patch.customerName); }

  if (fields.length === 0) return getConversation(phone);

  values.push(phone);
  const { rows } = await pool.query<ConversationRow>(
    `UPDATE conversations SET ${fields.join(", ")}
     WHERE phone = $${idx}
     RETURNING *`,
    values
  );

  return rows[0] ? rowToConversation(rows[0]) : null;
}

export async function listConversations(
  filter: ConversationFilter = {}
): Promise<Conversation[]> {
  const conditions: string[] = [];
  const values: string[] = [];
  let idx = 1;

  if (filter.tag) { conditions.push(`c.tag = $${idx++}`); values.push(filter.tag); }
  if (filter.status) { conditions.push(`c.status = $${idx++}`); values.push(filter.status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query<ConversationRow & { last_message: string }>(
    `SELECT c.*,
            (SELECT content FROM messages
             WHERE phone = c.phone
             ORDER BY created_at DESC
             LIMIT 1) AS last_message
     FROM conversations c
     ${where}
     ORDER BY c.last_message_at DESC`,
    values
  );

  return rows.map((r) => ({
    ...rowToConversation(r),
    lastMessage: r.last_message ?? undefined,
  }));
}

export async function getConversation(phone: string): Promise<Conversation | null> {
  const { rows } = await pool.query<ConversationRow>(
    "SELECT * FROM conversations WHERE phone = $1",
    [phone]
  );
  return rows[0] ? rowToConversation(rows[0]) : null;
}

// ── helpers ────────────────────────────────────────────────────────────────

interface ConversationRow {
  phone: string;
  customer_name: string | null;
  tag: "suporte" | "venda";
  status: "pendente" | "concluido";
  last_message_at: Date;
  created_at: Date;
}

function rowToConversation(r: ConversationRow): Conversation {
  return {
    phone: r.phone,
    customerName: r.customer_name,
    tag: r.tag,
    status: r.status,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
  };
}
