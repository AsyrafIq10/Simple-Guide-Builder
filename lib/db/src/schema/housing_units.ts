import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const housingUnitsTable = pgTable("housing_units", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  unitNumber: text("unit_number").notNull(),
  block: text("block"),
  phase: text("phase"),
  purchaserName: text("purchaser_name"),
  purchaserContact: text("purchaser_contact"),
  pvCapacityKwp: numeric("pv_capacity_kwp", { precision: 8, scale: 3 }),
  inverterModel: text("inverter_model"),
  inverterSerial: text("inverter_serial"),
  moduleModel: text("module_model"),
  moduleSerial: text("module_serial"),
  utilityAccountNumber: text("utility_account_number"),
  meterNumber: text("meter_number"),
  nemApplicationDate: text("nem_application_date"),
  nemApprovalDate: text("nem_approval_date"),
  commissioningDate: text("commissioning_date"),
  handoverDate: text("handover_date"),
  warrantyStart: text("warranty_start"),
  warrantyEnd: text("warranty_end"),
  unitStatus: text("unit_status").notNull().default("not_started"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHousingUnitSchema = createInsertSchema(housingUnitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHousingUnit = z.infer<typeof insertHousingUnitSchema>;
export type HousingUnit = typeof housingUnitsTable.$inferSelect;
