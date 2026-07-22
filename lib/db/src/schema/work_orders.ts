import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workOrdersTable = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  workOrderNumber: text("work_order_number").notNull().unique(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("medium"),
  description: text("description").notNull(),
  assignedTo: text("assigned_to"),
  scheduledDate: text("scheduled_date"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  status: text("status").notNull().default("open"),
  labourCost: numeric("labour_cost", { precision: 12, scale: 2 }),
  materialCost: numeric("material_cost", { precision: 12, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }),
  findings: text("findings"),
  correctiveAction: text("corrective_action"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrdersTable.$inferSelect;
