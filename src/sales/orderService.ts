import { pool } from "../db/pool";
import { updateConversation } from "../services/conversationService";

export interface OrderInput {
  phone: string;
  customerName: string;
  customerEmail: string;
  company?: string;
  product: string;
}

export interface Order extends OrderInput {
  id: number;
  status: string;
  createdAt: Date;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const { rows } = await pool.query<{
    id: number;
    status: string;
    created_at: Date;
  }>(
    `INSERT INTO orders (phone, customer_name, customer_email, company, product)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, status, created_at`,
    [input.phone, input.customerName, input.customerEmail, input.company ?? null, input.product]
  );

  const row = rows[0];

  // Auto-classifica a conversa como venda concluída no dashboard
  await updateConversation(input.phone, {
    tag: "venda",
    status: "concluido",
    customerName: input.customerName,
  });

  return { ...input, id: row.id, status: row.status, createdAt: row.created_at };
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const { rows } = await pool.query<{
    id: number;
    phone: string;
    customer_name: string;
    customer_email: string;
    company: string | null;
    product: string;
    status: string;
    created_at: Date;
  }>(
    `SELECT * FROM orders WHERE phone = $1 ORDER BY created_at DESC`,
    [phone]
  );

  return rows.map((r) => ({
    id: r.id,
    phone: r.phone,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    company: r.company ?? undefined,
    product: r.product,
    status: r.status,
    createdAt: r.created_at,
  }));
}
