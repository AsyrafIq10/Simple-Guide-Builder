import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, equipmentTable } from "@workspace/db";
import {
  CreateEquipmentBody,
  CreateEquipmentParams,
  GetEquipmentParams,
  UpdateEquipmentParams,
  UpdateEquipmentBody,
  DeleteEquipmentParams,
  ListEquipmentParams,
  ListEquipmentResponse,
  CreateEquipmentResponse,
  GetEquipmentResponse,
  UpdateEquipmentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (r: typeof equipmentTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
});

router.get("/assets/:assetId/equipment", async (req, res): Promise<void> => {
  const params = ListEquipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(equipmentTable)
    .where(eq(equipmentTable.assetId, params.data.assetId))
    .orderBy(equipmentTable.createdAt);
  res.json(ListEquipmentResponse.parse(rows.map(toDto)));
});

router.post("/assets/:assetId/equipment", async (req, res): Promise<void> => {
  const params = CreateEquipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateEquipmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(equipmentTable)
    .values({ ...parsed.data, assetId: params.data.assetId })
    .returning();
  res.status(201).json(CreateEquipmentResponse.parse(toDto(row)));
});

router.get("/equipment/:equipmentId", async (req, res): Promise<void> => {
  const params = GetEquipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, params.data.equipmentId));
  if (!row) {
    res.status(404).json({ error: "Equipment not found" });
    return;
  }
  res.json(GetEquipmentResponse.parse(toDto(row)));
});

router.patch("/equipment/:equipmentId", async (req, res): Promise<void> => {
  const params = UpdateEquipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEquipmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(equipmentTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(equipmentTable.id, params.data.equipmentId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Equipment not found" });
    return;
  }
  res.json(UpdateEquipmentResponse.parse(toDto(row)));
});

router.delete("/equipment/:equipmentId", async (req, res): Promise<void> => {
  const params = DeleteEquipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(equipmentTable).where(eq(equipmentTable.id, params.data.equipmentId));
  res.sendStatus(204);
});

export default router;
