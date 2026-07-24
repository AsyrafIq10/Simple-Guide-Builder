import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { attachmentsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// GET /attachments?entityType=site&entityId=1
router.get("/attachments", async (req: Request, res: Response) => {
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) {
    res.status(400).json({ error: "entityType and entityId are required" });
    return;
  }
  const rows = await db
    .select()
    .from(attachmentsTable)
    .where(
      and(
        eq(attachmentsTable.entityType, String(entityType)),
        eq(attachmentsTable.entityId, Number(entityId)),
      ),
    )
    .orderBy(attachmentsTable.createdAt);
  res.json(rows);
});

// POST /attachments
router.post("/attachments", async (req: Request, res: Response) => {
  const { entityType, entityId, category, fileName, objectPath, mimeType } =
    req.body;
  if (!entityType || !entityId || !category || !fileName || !objectPath) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [row] = await db
    .insert(attachmentsTable)
    .values({ entityType, entityId: Number(entityId), category, fileName, objectPath, mimeType })
    .returning();
  res.status(201).json(row);
});

// DELETE /attachments/:attachmentId
router.delete(
  "/attachments/:attachmentId",
  async (req: Request, res: Response) => {
    const id = Number(req.params.attachmentId);
    await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id));
    res.status(204).end();
  },
);

export default router;
