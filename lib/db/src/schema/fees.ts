import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const feesTable = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  tuitionFee: numeric("tuition_fee", { precision: 10, scale: 2 }).notNull(),
  labFee: numeric("lab_fee", { precision: 10, scale: 2 }).notNull(),
  examFee: numeric("exam_fee", { precision: 10, scale: 2 }).notNull(),
  totalFee: numeric("total_fee", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  status: text("status").default("unpaid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeeSchema = createInsertSchema(feesTable).omit({
  id: true,
  totalFee: true,
  status: true,
  createdAt: true,
});

export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = typeof feesTable.$inferSelect;
