import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const performanceTable = pgTable("performance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  marks: numeric("marks", { precision: 5, scale: 2 }).notNull(),
  maxMarks: numeric("max_marks", { precision: 5, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPerformanceSchema = createInsertSchema(performanceTable).omit({
  id: true,
  percentage: true,
  createdAt: true,
});

export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type Performance = typeof performanceTable.$inferSelect;
