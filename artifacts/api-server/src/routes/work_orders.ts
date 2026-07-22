import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, workOrdersTable } from "@workspace/db";
import {
  CreateWorkOrderBody,
  GetWorkOrderParams,
  UpdateWorkOrderParams,
  UpdateWorkOrderBody,
  DeleteWorkOrderParams,
  ListWorkOrdersResponse,
  CreateWorkOrderResponse,
  GetWorkOrderResponse,
  UpdateWorkOrderResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (r: typeof workOrdersTable.$inferSelect) => ({
  ...r,
  labourCost: r.labourCost ? Number(r.labourCost) : null,
  materialCost: r.materialCost ? Number(r.materialCost) : null,
  totalCost: r.totalCost ? Number(r.totalCost) : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
});

function generateWorkOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `WO-${ts}`;
}

router.get("/work-orders", async (_req, res): Promise<void> => {
  const rows = await db.select().from(workOrdersTable).orderBy(sql`${workOrdersTable.createdAt} DESC`);
  res.json(ListWorkOrdersResponse.parse(rows.map(toDto)));
});

router.post("/work-orders", async (req, res): Promise<void> => {
  const parsed = CreateWorkOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(workOrdersTable)
    .values({ ...parsed.data, workOrderNumber: generateWorkOrderNumber() })
    .returning();
  res.status(201).json(CreateWorkOrderResponse.parse(toDto(row)));
});

router.get("/work-orders/:workOrderId", async (req, res): Promise<void> => {
  const params = GetWorkOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, params.data.workOrderId));
  if (!row) {
    res.status(404).json({ error: "Work order not found" });
    return;
  }
  res.json(GetWorkOrderResponse.parse(toDto(row)));
});

router.patch("/work-orders/:workOrderId", async (req, res): Promise<void> => {
  const params = UpdateWorkOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWorkOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.labourCost != null) updateData.labourCost = String(parsed.data.labourCost);
  if (parsed.data.materialCost != null) updateData.materialCost = String(parsed.data.materialCost);
  const [row] = await db
    .update(workOrdersTable)
    .set(updateData)
    .where(eq(workOrdersTable.id, params.data.workOrderId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Work order not found" });
    return;
  }
  res.json(UpdateWorkOrderResponse.parse(toDto(row)));
});

router.delete("/work-orders/:workOrderId", async (req, res): Promise<void> => {
  const params = DeleteWorkOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(workOrdersTable).where(eq(workOrdersTable.id, params.data.workOrderId));
  res.sendStatus(204);
});

export default router;
