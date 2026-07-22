import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, housingUnitsTable } from "@workspace/db";
import {
  CreateHousingUnitBody,
  ListHousingUnitsParams,
  GetHousingUnitParams,
  UpdateHousingUnitParams,
  UpdateHousingUnitBody,
  DeleteHousingUnitParams,
  ListHousingUnitsResponse,
  CreateHousingUnitResponse,
  GetHousingUnitResponse,
  UpdateHousingUnitResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (r: typeof housingUnitsTable.$inferSelect) => ({
  ...r,
  pvCapacityKwp: r.pvCapacityKwp ? Number(r.pvCapacityKwp) : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
});

router.get("/developer-projects/:projectId/units", async (req, res): Promise<void> => {
  const params = ListHousingUnitsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(housingUnitsTable)
    .where(eq(housingUnitsTable.projectId, params.data.projectId))
    .orderBy(housingUnitsTable.unitNumber);
  res.json(ListHousingUnitsResponse.parse(rows.map(toDto)));
});

router.post("/developer-projects/:projectId/units", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(rawId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid projectId" });
    return;
  }
  const parsed = CreateHousingUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insertData = {
    ...parsed.data,
    projectId,
    pvCapacityKwp: parsed.data.pvCapacityKwp != null ? String(parsed.data.pvCapacityKwp) : null,
  };
  const [row] = await db.insert(housingUnitsTable).values(insertData).returning();
  res.status(201).json(CreateHousingUnitResponse.parse(toDto(row)));
});

router.get("/housing-units/:unitId", async (req, res): Promise<void> => {
  const params = GetHousingUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(housingUnitsTable).where(eq(housingUnitsTable.id, params.data.unitId));
  if (!row) {
    res.status(404).json({ error: "Housing unit not found" });
    return;
  }
  res.json(GetHousingUnitResponse.parse(toDto(row)));
});

router.patch("/housing-units/:unitId", async (req, res): Promise<void> => {
  const params = UpdateHousingUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateHousingUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.pvCapacityKwp != null) updateData.pvCapacityKwp = String(parsed.data.pvCapacityKwp);
  const [row] = await db
    .update(housingUnitsTable)
    .set(updateData)
    .where(eq(housingUnitsTable.id, params.data.unitId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Housing unit not found" });
    return;
  }
  res.json(UpdateHousingUnitResponse.parse(toDto(row)));
});

router.delete("/housing-units/:unitId", async (req, res): Promise<void> => {
  const params = DeleteHousingUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(housingUnitsTable).where(eq(housingUnitsTable.id, params.data.unitId));
  res.sendStatus(204);
});

export default router;
