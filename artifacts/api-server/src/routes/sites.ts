import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sitesTable } from "@workspace/db";
import {
  CreateSiteBody,
  GetSiteParams,
  UpdateSiteParams,
  UpdateSiteBody,
  DeleteSiteParams,
  ListSitesResponse,
  CreateSiteResponse,
  GetSiteResponse,
  UpdateSiteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (r: typeof sitesTable.$inferSelect) => ({
  ...r,
  latitude: r.latitude ? Number(r.latitude) : null,
  longitude: r.longitude ? Number(r.longitude) : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
});

router.get("/sites", async (_req, res): Promise<void> => {
  const rows = await db.select().from(sitesTable).orderBy(sitesTable.siteCode);
  res.json(ListSitesResponse.parse(rows.map(toDto)));
});

router.post("/sites", async (req, res): Promise<void> => {
  const parsed = CreateSiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insertData = {
    ...parsed.data,
    latitude: parsed.data.latitude != null ? String(parsed.data.latitude) : null,
    longitude: parsed.data.longitude != null ? String(parsed.data.longitude) : null,
  };
  const [row] = await db.insert(sitesTable).values(insertData).returning();
  res.status(201).json(CreateSiteResponse.parse(toDto(row)));
});

router.get("/sites/:siteId", async (req, res): Promise<void> => {
  const params = GetSiteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(sitesTable).where(eq(sitesTable.id, params.data.siteId));
  if (!row) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  res.json(GetSiteResponse.parse(toDto(row)));
});

router.patch("/sites/:siteId", async (req, res): Promise<void> => {
  const params = UpdateSiteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.latitude != null) updateData.latitude = String(parsed.data.latitude);
  if (parsed.data.longitude != null) updateData.longitude = String(parsed.data.longitude);
  const [row] = await db
    .update(sitesTable)
    .set(updateData)
    .where(eq(sitesTable.id, params.data.siteId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  res.json(UpdateSiteResponse.parse(toDto(row)));
});

router.delete("/sites/:siteId", async (req, res): Promise<void> => {
  const params = DeleteSiteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(sitesTable).where(eq(sitesTable.id, params.data.siteId));
  res.sendStatus(204);
});

export default router;
