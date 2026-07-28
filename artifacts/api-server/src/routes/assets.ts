import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pvAssetsTable } from "@workspace/db";
import {
  CreateAssetBody,
  GetAssetParams,
  UpdateAssetParams,
  UpdateAssetBody,
  DeleteAssetParams,
  ListAssetsResponse,
  CreateAssetResponse,
  GetAssetResponse,
  UpdateAssetResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (r: typeof pvAssetsTable.$inferSelect) => ({
  ...r,
  installedCapacityKwp: r.installedCapacityKwp ? Number(r.installedCapacityKwp) : null,
  acCapacityKw: r.acCapacityKw ? Number(r.acCapacityKw) : null,
  fusionSolarStationCode: r.fusionSolarStationCode ?? null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
});

router.get("/assets", async (_req, res): Promise<void> => {
  const rows = await db.select().from(pvAssetsTable).orderBy(pvAssetsTable.assetCode);
  res.json(ListAssetsResponse.parse(rows.map(toDto)));
});

router.post("/assets", async (req, res): Promise<void> => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insertData = {
    ...parsed.data,
    installedCapacityKwp: parsed.data.installedCapacityKwp != null ? String(parsed.data.installedCapacityKwp) : null,
    acCapacityKw: parsed.data.acCapacityKw != null ? String(parsed.data.acCapacityKw) : null,
  };
  const [row] = await db.insert(pvAssetsTable).values(insertData).returning();
  res.status(201).json(CreateAssetResponse.parse(toDto(row)));
});

router.get("/assets/:assetId", async (req, res): Promise<void> => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(pvAssetsTable).where(eq(pvAssetsTable.id, params.data.assetId));
  if (!row) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(GetAssetResponse.parse(toDto(row)));
});

router.patch("/assets/:assetId", async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.installedCapacityKwp != null) updateData.installedCapacityKwp = String(parsed.data.installedCapacityKwp);
  if (parsed.data.acCapacityKw != null) updateData.acCapacityKw = String(parsed.data.acCapacityKw);
  const [row] = await db
    .update(pvAssetsTable)
    .set(updateData)
    .where(eq(pvAssetsTable.id, params.data.assetId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(UpdateAssetResponse.parse(toDto(row)));
});

router.delete("/assets/:assetId", async (req, res): Promise<void> => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(pvAssetsTable).where(eq(pvAssetsTable.id, params.data.assetId));
  res.sendStatus(204);
});

export default router;
