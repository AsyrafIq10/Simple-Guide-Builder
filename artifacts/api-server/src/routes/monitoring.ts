import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pvAssetsTable } from "@workspace/db";
import * as fs from "../lib/fusionSolar.js";
import { FusionSolarError } from "../lib/fusionSolar.js";

const router: IRouter = Router();

// Map typed FusionSolar errors to friendly HTTP responses
function handleFusionSolarError(e: unknown, res: any): void {
  if (e instanceof FusionSolarError) {
    switch (e.code) {
      case "CREDENTIALS_MISSING":
        res.status(503).json({
          error: "FusionSolar credentials not configured — contact your system administrator",
          code: e.code,
        });
        return;
      case "LOGIN_FAILED":
        res.status(502).json({
          error: "FusionSolar login failed — check your Northbound API credentials",
          code: e.code,
        });
        return;
      case "STATION_NOT_FOUND":
        res.status(502).json({
          error: "Station code not found in FusionSolar — verify the code in FusionSolar → Plant List",
          code: e.code,
        });
        return;
      case "DEVICE_NOT_FOUND":
        res.status(502).json({
          error: "No inverter found for this station — ensure the device is registered in FusionSolar",
          code: e.code,
        });
        return;
      default:
        res.status(502).json({
          error: `FusionSolar API error — ${e.message}`,
          code: e.code,
        });
        return;
    }
  }
  // Unknown error
  res.status(502).json({ error: "Unexpected monitoring error — please try again", code: "API_ERROR" });
}

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
  } catch (e) {
    handleFusionSolarError(e, res);
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
  } catch (e) {
    handleFusionSolarError(e, res);
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
  } catch (e) {
    handleFusionSolarError(e, res);
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
  } catch (e) {
    handleFusionSolarError(e, res);
  }
});

export default router;
