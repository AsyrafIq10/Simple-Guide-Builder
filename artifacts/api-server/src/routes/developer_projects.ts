import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, developerProjectsTable, housingUnitsTable } from "@workspace/db";
import {
  CreateDeveloperProjectBody,
  GetDeveloperProjectParams,
  UpdateDeveloperProjectParams,
  UpdateDeveloperProjectBody,
  DeleteDeveloperProjectParams,
  GetDeveloperProjectSummaryParams,
  ListDeveloperProjectsResponse,
  CreateDeveloperProjectResponse,
  GetDeveloperProjectResponse,
  UpdateDeveloperProjectResponse,
  GetDeveloperProjectSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (r: typeof developerProjectsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
});

router.get("/developer-projects", async (_req, res): Promise<void> => {
  const rows = await db.select().from(developerProjectsTable).orderBy(developerProjectsTable.createdAt);
  res.json(ListDeveloperProjectsResponse.parse(rows.map(toDto)));
});

router.post("/developer-projects", async (req, res): Promise<void> => {
  const parsed = CreateDeveloperProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(developerProjectsTable).values(parsed.data).returning();
  res.status(201).json(CreateDeveloperProjectResponse.parse(toDto(row)));
});

router.get("/developer-projects/:projectId", async (req, res): Promise<void> => {
  const params = GetDeveloperProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(developerProjectsTable).where(eq(developerProjectsTable.id, params.data.projectId));
  if (!row) {
    res.status(404).json({ error: "Developer project not found" });
    return;
  }
  res.json(GetDeveloperProjectResponse.parse(toDto(row)));
});

router.patch("/developer-projects/:projectId", async (req, res): Promise<void> => {
  const params = UpdateDeveloperProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDeveloperProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(developerProjectsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(developerProjectsTable.id, params.data.projectId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Developer project not found" });
    return;
  }
  res.json(UpdateDeveloperProjectResponse.parse(toDto(row)));
});

router.delete("/developer-projects/:projectId", async (req, res): Promise<void> => {
  const params = DeleteDeveloperProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(developerProjectsTable).where(eq(developerProjectsTable.id, params.data.projectId));
  res.sendStatus(204);
});

router.get("/developer-projects/:projectId/summary", async (req, res): Promise<void> => {
  const params = GetDeveloperProjectSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const pid = params.data.projectId;

  const [totalRow] = await db.select({ total: count() }).from(housingUnitsTable).where(eq(housingUnitsTable.projectId, pid));
  const [installedRow] = await db.select({ total: count() }).from(housingUnitsTable).where(
    sql`${housingUnitsTable.projectId} = ${pid} AND ${housingUnitsTable.unitStatus} IN ('installation_completed','testing_completed','utility_submission_pending','utility_submission_submitted','utility_approval_received','meter_installed','commissioned','handover_pending','handed_over','under_warranty','closed')`
  );
  const [commissionedRow] = await db.select({ total: count() }).from(housingUnitsTable).where(
    sql`${housingUnitsTable.projectId} = ${pid} AND ${housingUnitsTable.unitStatus} IN ('commissioned','handover_pending','handed_over','under_warranty','closed')`
  );
  const [handedOverRow] = await db.select({ total: count() }).from(housingUnitsTable).where(
    sql`${housingUnitsTable.projectId} = ${pid} AND ${housingUnitsTable.unitStatus} IN ('handed_over','under_warranty','closed')`
  );
  const [nemSubmittedRow] = await db.select({ total: count() }).from(housingUnitsTable).where(
    sql`${housingUnitsTable.projectId} = ${pid} AND ${housingUnitsTable.unitStatus} IN ('utility_submission_submitted','utility_approval_received','meter_installed','commissioned','handover_pending','handed_over','under_warranty','closed')`
  );
  const [nemApprovedRow] = await db.select({ total: count() }).from(housingUnitsTable).where(
    sql`${housingUnitsTable.projectId} = ${pid} AND ${housingUnitsTable.unitStatus} IN ('utility_approval_received','meter_installed','commissioned','handover_pending','handed_over','under_warranty','closed')`
  );

  const total = Number(totalRow.total);
  const handed = Number(handedOverRow.total);

  const summary = {
    totalUnits: total,
    installed: Number(installedRow.total),
    commissioned: Number(commissionedRow.total),
    handedOver: handed,
    nemSubmitted: Number(nemSubmittedRow.total),
    nemApproved: Number(nemApprovedRow.total),
    outstanding: total - handed,
  };

  res.json(GetDeveloperProjectSummaryResponse.parse(summary));
});

export default router;
