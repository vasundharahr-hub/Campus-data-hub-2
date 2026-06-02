import { Router } from "express";
import { db, performanceTable, studentsTable } from "@workspace/db";
import {
  ListPerformanceQueryParams,
  CreatePerformanceBody,
  UpdatePerformanceParams,
  UpdatePerformanceBody,
  DeletePerformanceParams,
} from "@workspace/api-zod";
import { eq, avg } from "drizzle-orm";
import { studentsTable as st } from "@workspace/db";

const router = Router();

function formatPerf(p: typeof performanceTable.$inferSelect, studentName: string | null) {
  return {
    id: p.id,
    studentId: p.studentId,
    studentName: studentName ?? null,
    subject: p.subject,
    marks: Number(p.marks),
    maxMarks: Number(p.maxMarks),
    percentage: p.percentage !== null ? Number(p.percentage) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

async function recalcStudentAverage(studentId: number) {
  const [result] = await db
    .select({ avgPct: avg(performanceTable.percentage) })
    .from(performanceTable)
    .where(eq(performanceTable.studentId, studentId));

  const avgVal = result?.avgPct !== null ? Number(result.avgPct) : null;
  let grade: string | null = null;
  if (avgVal !== null) {
    if (avgVal >= 90) grade = "A";
    else if (avgVal >= 75) grade = "B";
    else if (avgVal >= 60) grade = "C";
    else grade = "D";
  }

  await db
    .update(st)
    .set({
      average: avgVal !== null ? String(avgVal.toFixed(2)) : null,
      grade,
    })
    .where(eq(st.id, studentId));
}

// GET /performance
router.get("/performance", async (req, res) => {
  const parsed = ListPerformanceQueryParams.safeParse({
    studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const where = parsed.data.studentId
    ? eq(performanceTable.studentId, parsed.data.studentId)
    : undefined;

  const rows = await db
    .select({
      perf: performanceTable,
      studentName: studentsTable.name,
    })
    .from(performanceTable)
    .leftJoin(studentsTable, eq(performanceTable.studentId, studentsTable.id))
    .where(where)
    .orderBy(performanceTable.createdAt);

  res.json(rows.map((r) => formatPerf(r.perf, r.studentName ?? null)));
});

// POST /performance
router.post("/performance", async (req, res) => {
  const parsed = CreatePerformanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { studentId, subject, marks, maxMarks } = parsed.data;
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;

  const [perf] = await db
    .insert(performanceTable)
    .values({
      studentId,
      subject,
      marks: String(marks),
      maxMarks: String(maxMarks),
      percentage: String(percentage.toFixed(2)),
    })
    .returning();

  await recalcStudentAverage(studentId);

  const [row] = await db
    .select({ perf: performanceTable, studentName: studentsTable.name })
    .from(performanceTable)
    .leftJoin(studentsTable, eq(performanceTable.studentId, studentsTable.id))
    .where(eq(performanceTable.id, perf.id));

  res.status(201).json(formatPerf(row.perf, row.studentName ?? null));
});

// PUT /performance/:id
router.put("/performance/:id", async (req, res) => {
  const paramsParsed = UpdatePerformanceParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdatePerformanceBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [existing] = await db
    .select()
    .from(performanceTable)
    .where(eq(performanceTable.id, paramsParsed.data.id));

  if (!existing) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  const marks = bodyParsed.data.marks ?? Number(existing.marks);
  const maxMarks = bodyParsed.data.maxMarks ?? Number(existing.maxMarks);
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;

  const [perf] = await db
    .update(performanceTable)
    .set({
      ...(bodyParsed.data.subject && { subject: bodyParsed.data.subject }),
      marks: String(marks),
      maxMarks: String(maxMarks),
      percentage: String(percentage.toFixed(2)),
    })
    .where(eq(performanceTable.id, paramsParsed.data.id))
    .returning();

  await recalcStudentAverage(perf.studentId);

  const [row] = await db
    .select({ perf: performanceTable, studentName: studentsTable.name })
    .from(performanceTable)
    .leftJoin(studentsTable, eq(performanceTable.studentId, studentsTable.id))
    .where(eq(performanceTable.id, perf.id));

  res.json(formatPerf(row.perf, row.studentName ?? null));
});

// DELETE /performance/:id
router.delete("/performance/:id", async (req, res) => {
  const parsed = DeletePerformanceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(performanceTable)
    .where(eq(performanceTable.id, parsed.data.id));

  if (!existing) {
    res.status(404).send();
    return;
  }

  await db.delete(performanceTable).where(eq(performanceTable.id, parsed.data.id));
  await recalcStudentAverage(existing.studentId);
  res.status(204).send();
});

export default router;
