import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const developerProjectsTable = pgTable("developer_projects", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  projectCode: text("project_code").notNull().unique(),
  developerName: text("developer_name").notNull(),
  location: text("location"),
  totalUnits: integer("total_units"),
  status: text("status").notNull().default("planning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDeveloperProjectSchema = createInsertSchema(developerProjectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeveloperProject = z.infer<typeof insertDeveloperProjectSchema>;
export type DeveloperProject = typeof developerProjectsTable.$inferSelect;
