import { Router } from "express";
import { db, feesTable, studentsTable } from "@workspace/db";
import {
  ListFeesQueryParams,
  CreateFeeBody,
  UpdateFeeParams,
  UpdateFeeBody,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

function computeStatus(paidAmount: number, totalFee: number): string {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalFee) return "paid";
  return "partial";
}

function formatFee(f: typeof feesTable.$inferSelect, studentName: string | null) {
  const total = Number(f.totalFee);
  const paid = Number(f.paidAmount);
  return {
    id: f.id,
    studentId: f.studentId,
    studentName: studentName ?? null,
    tuitionFee: Number(f.tuitionFee),
    labFee: Number(f.labFee),
    examFee: Number(f.examFee),
    totalFee: total,
    paidAmount: paid,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
  };
}

// GET /fees
router.get("/fees", async (req, res) => {
  const parsed = ListFeesQueryParams.safeParse({
    studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
    status: req.query.status,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const conditions = [];
  if (parsed.data.studentId) conditions.push(eq(feesTable.studentId, parsed.data.studentId));
  if (parsed.data.status) conditions.push(eq(feesTable.status, parsed.data.status));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      fee: feesTable,
      studentName: studentsTable.name,
    })
    .from(feesTable)
    .leftJoin(studentsTable, eq(feesTable.studentId, studentsTable.id))
    .where(where)
    .orderBy(feesTable.createdAt);

  res.json(rows.map((r) => formatFee(r.fee, r.studentName ?? null)));
});

// POST /fees
router.post("/fees", async (req, res) => {
  const parsed = CreateFeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { studentId, tuitionFee, labFee, examFee, paidAmount = 0 } = parsed.data;
  const totalFee = tuitionFee + labFee + examFee;
  const status = computeStatus(paidAmount, totalFee);

  const [fee] = await db
    .insert(feesTable)
    .values({
      studentId,
      tuitionFee: String(tuitionFee),
      labFee: String(labFee),
      examFee: String(examFee),
      totalFee: String(totalFee),
      paidAmount: String(paidAmount),
      status,
    })
    .returning();

  const [row] = await db
    .select({ fee: feesTable, studentName: studentsTable.name })
    .from(feesTable)
    .leftJoin(studentsTable, eq(feesTable.studentId, studentsTable.id))
    .where(eq(feesTable.id, fee.id));

  res.status(201).json(formatFee(row.fee, row.studentName ?? null));
});

// PUT /fees/:id
router.put("/fees/:id", async (req, res) => {
  const paramsParsed = UpdateFeeParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateFeeBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [existing] = await db.select().from(feesTable).where(eq(feesTable.id, paramsParsed.data.id));
  if (!existing) {
    res.status(404).json({ error: "Fee record not found" });
    return;
  }

  const tuitionFee = bodyParsed.data.tuitionFee ?? Number(existing.tuitionFee);
  const labFee = bodyParsed.data.labFee ?? Number(existing.labFee);
  const examFee = bodyParsed.data.examFee ?? Number(existing.examFee);
  const paidAmount = bodyParsed.data.paidAmount ?? Number(existing.paidAmount);
  const totalFee = tuitionFee + labFee + examFee;
  const status = bodyParsed.data.status ?? computeStatus(paidAmount, totalFee);

  const [fee] = await db
    .update(feesTable)
    .set({
      tuitionFee: String(tuitionFee),
      labFee: String(labFee),
      examFee: String(examFee),
      totalFee: String(totalFee),
      paidAmount: String(paidAmount),
      status,
    })
    .where(eq(feesTable.id, paramsParsed.data.id))
    .returning();

  const [row] = await db
    .select({ fee: feesTable, studentName: studentsTable.name })
    .from(feesTable)
    .leftJoin(studentsTable, eq(feesTable.studentId, studentsTable.id))
    .where(eq(feesTable.id, fee.id));

  res.json(formatFee(row.fee, row.studentName ?? null));
});

export default router;
