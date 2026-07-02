import { Router, Request, Response } from "express";
import { getSettings, updateSettings } from "../services/settingsService";

const router = Router();

// GET /api/bot — retorna configurações (omite tokens sensíveis)
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const s = await getSettings();
  res.json({
    enabled: s.enabled,
    phoneDisplay: s.phoneDisplay,
    instanceId: s.instanceId,
    hasToken: s.token.length > 0,
    hasClientToken: s.clientToken.length > 0,
  });
});

// PATCH /api/bot — atualiza configurações
router.patch("/", async (req: Request, res: Response): Promise<void> => {
  const { enabled, instanceId, token, clientToken, phoneDisplay } = req.body as {
    enabled?: boolean;
    instanceId?: string;
    token?: string;
    clientToken?: string;
    phoneDisplay?: string;
  };

  const updated = await updateSettings({ enabled, instanceId, token, clientToken, phoneDisplay });
  res.json({
    enabled: updated.enabled,
    phoneDisplay: updated.phoneDisplay,
    instanceId: updated.instanceId,
    hasToken: updated.token.length > 0,
    hasClientToken: updated.clientToken.length > 0,
  });
});

export default router;
