import { Router, Request, Response } from "express";
import { pool } from "../db/pool";
import {
  listConversations,
  updateConversation,
  ConversationFilter,
} from "../services/conversationService";

const router = Router();

// GET /api/conversations?tag=suporte&status=pendente
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const filter: ConversationFilter = {};
  if (req.query.tag === "suporte" || req.query.tag === "venda") {
    filter.tag = req.query.tag;
  }
  if (req.query.status === "pendente" || req.query.status === "concluido") {
    filter.status = req.query.status;
  }

  const conversations = await listConversations(filter);
  res.json(conversations);
});

// GET /api/conversations/:phone/messages
router.get("/:phone/messages", async (req: Request, res: Response): Promise<void> => {
  const phone = String(req.params.phone);
  const { rows } = await pool.query<{ role: string; content: string; created_at: Date }>(
    `SELECT role, content, created_at
     FROM messages
     WHERE phone = $1
     ORDER BY created_at ASC`,
    [phone]
  );
  res.json(rows);
});

// DELETE /api/conversations/:phone/messages — apaga histórico para testes
router.delete("/:phone/messages", async (req: Request, res: Response): Promise<void> => {
  const phone = String(req.params.phone);
  await pool.query("DELETE FROM messages WHERE phone = $1", [phone]);
  await pool.query("DELETE FROM conversations WHERE phone = $1", [phone]);
  res.json({ success: true });
});

// PATCH /api/conversations/:phone
router.patch("/:phone", async (req: Request, res: Response): Promise<void> => {
  const phone = String(req.params.phone);
  const { tag, status, customerName } = req.body as {
    tag?: string;
    status?: string;
    customerName?: string;
  };

  const updated = await updateConversation(phone, { tag, status, customerName });
  if (!updated) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }
  res.json(updated);
});

export default router;
