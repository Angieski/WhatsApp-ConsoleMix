import "dotenv/config";
import path from "path";
import express from "express";
import { handleIncoming } from "./webhook/zapiHandler";
import conversationsRouter from "./api/conversationsRouter";
import botRouter from "./api/botRouter";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Webhook Z-API
app.post("/webhook/whatsapp", handleIncoming);

// API REST do dashboard
app.use("/api/conversations", conversationsRouter);
app.use("/api/bot", botRouter);

// Dashboard estático
app.use("/dashboard", express.static(path.join(__dirname, "..", "public")));

// Redireciona raiz para o dashboard
app.get("/", (_req, res) => res.redirect("/dashboard"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`Webhook:   POST http://localhost:${PORT}/webhook/whatsapp`);
});
