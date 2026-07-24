import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attachmentsTable = pgTable("attachments", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'site' | 'asset'
  entityId: integer("entity_id").notNull(),
  category: text("category").notNull(), // 'photo' | 'drawing'
  fileName: text("file_name").notNull(),
  objectPath: text("object_path").notNull(),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAttachmentSchema = createInsertSchema(attachmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachmentsTable.$inferSelect;
