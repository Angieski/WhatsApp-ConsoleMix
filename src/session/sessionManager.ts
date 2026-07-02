import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { pool } from "../db/pool";

const MAX_HISTORY = 20;

export async function getHistory(phoneNumber: string): Promise<MessageParam[]> {
  const { rows } = await pool.query<{ role: string; content: string }>(
    `SELECT role, content FROM (
       SELECT role, content, created_at
       FROM messages
       WHERE phone = $1
       ORDER BY created_at DESC
       LIMIT $2
     ) sub
     ORDER BY created_at ASC`,
    [phoneNumber, MAX_HISTORY]
  );

  return rows.map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
  }));
}

export async function appendToHistory(
  phoneNumber: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await pool.query(
    `INSERT INTO messages (phone, role, content) VALUES ($1, $2, $3)`,
    [phoneNumber, role, content]
  );
}
