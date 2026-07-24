import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pvAssetsTable } from "@workspace/db";
import * as fs from "../lib/fusionSolar.js";

const router: IRouter = Router();

async function resolveStationCode(assetId: number): Promise<string | null> {
  const [asset] = await db
    .select({ fusionSolarStationCode: pvAssetsTable.fusionSolarStationCode })
    .from(pvAssetsTable)
    .where(eq(pvAssetsTable.id, assetId));
  return asset?.fusionSolarStationCode ?? null;
}

router.get("/monitoring/:assetId/realtime", async (req, res): Promise<void> => {
  const assetId = Number(req.params.assetId);
  if (!Number.isInteger(assetId)) { res.status(400).json({ error: "Invalid assetId" }); return; }

  const stationCode = await resolveStationCode(assetId);
  if (!stationCode) {
    res.status(404).json({ error: "Asset not found or FusionSolar station code not configured" });
    return;
  }

  try {
    res.json(await fs.getRealtime(stationCode));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/monitoring/:assetId/daily", async (req, res): Promise<void> => {
  const assetId = Number(req.params.assetId);
  if (!Number.isInteger(assetId)) { res.status(400).json({ error: "Invalid assetId" }); return; }

  const stationCode = await resolveStationCode(assetId);
  if (!stationCode) {
    res.status(404).json({ error: "Asset not found or FusionSolar station code not configured" });
    return;
  }

  const date =
    typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

  try {
    res.json(await fs.getDaily(stationCode, date));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/monitoring/:assetId/monthly", async (req, res): Promise<void> => {
  const assetId = Number(req.params.assetId);
  if (!Number.isInteger(assetId)) { res.status(400).json({ error: "Invalid assetId" }); return; }

  const stationCode = await resolveStationCode(assetId);
  if (!stationCode) {
    res.status(404).json({ error: "Asset not found or FusionSolar station code not configured" });
    return;
  }

  const now = new Date();
  const year  = Number(req.query.year)  || now.getFullYear();
  const month = Number(req.query.month) || (now.getMonth() + 1);

  try {
    res.json(await fs.getMonthly(stationCode, year, month));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/monitoring/:assetId/annual", async (req, res): Promise<void> => {
  const assetId = Number(req.params.assetId);
  if (!Number.isInteger(assetId)) { res.status(400).json({ error: "Invalid assetId" }); return; }

  const stationCode = await resolveStationCode(assetId);
  if (!stationCode) {
    res.status(404).json({ error: "Asset not found or FusionSolar station code not configured" });
    return;
  }

  const year = Number(req.query.year) || new Date().getFullYear();

  try {
    res.json(await fs.getAnnual(stationCode, year));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

export default router;
