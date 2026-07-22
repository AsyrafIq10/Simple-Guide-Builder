import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pvAssetsTable = pgTable("pv_assets", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  assetName: text("asset_name").notNull(),
  assetCode: text("asset_code").notNull().unique(),
  systemType: text("system_type").notNull(),
  installedCapacityKwp: numeric("installed_capacity_kwp", { precision: 10, scale: 3 }),
  acCapacityKw: numeric("ac_capacity_kw", { precision: 10, scale: 3 }),
  interconnectionType: text("interconnection_type"),
  commissioningDate: text("commissioning_date"),
  designLifeYears: integer("design_life_years"),
  currentStatus: text("current_status").notNull().default("operational"),
  monitoringStatus: text("monitoring_status").notNull().default("not_configured"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPvAssetSchema = createInsertSchema(pvAssetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPvAsset = z.infer<typeof insertPvAssetSchema>;
export type PvAsset = typeof pvAssetsTable.$inferSelect;
