import { Router } from "express";
import { db, studentsTable, coursesTable, enrollmentsTable, feesTable, performanceTable } from "@workspace/db";
import { count, avg, sum, eq, desc } from "drizzle-orm";
import { GetTopStudentsQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", async (_req, res) => {
  const [studentStats] = await db
    .select({ total: count(), avgMarks: avg(studentsTable.average) })
    .from(studentsTable);

  const [courseStats] = await db.select({ total: count() }).from(coursesTable);
  const [enrollmentStats] = await db.select({ total: count() }).from(enrollmentsTable);

  const gradeRows = await db
    .select({ grade: studentsTable.grade, cnt: count() })
    .from(studentsTable)
    .groupBy(studentsTable.grade);

  const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const row of gradeRows) {
    if (row.grade && row.grade in gradeCounts) {
      gradeCounts[row.grade] = Number(row.cnt);
    }
  }

  res.json({
    totalStudents: Number(studentStats.total),
    totalCourses: Number(courseStats.total),
    totalEnrollments: Number(enrollmentStats.total),
    averageMarks: studentStats.avgMarks !== null ? Number(Number(studentStats.avgMarks).toFixed(2)) : 0,
    gradeACount: gradeCounts["A"],
    gradeBCount: gradeCounts["B"],
    gradeCCount: gradeCounts["C"],
    gradeDCount: gradeCounts["D"],
  });
});

// GET /dashboard/grade-distribution
router.get("/dashboard/grade-distribution", async (_req, res) => {
  const rows = await db
    .select({ grade: studentsTable.grade, cnt: count() })
    .from(studentsTable)
    .groupBy(studentsTable.grade);

  const ordered = ["A", "B", "C", "D"];
  const map: Record<string, number> = {};
  for (const r of rows) {
    if (r.grade) map[r.grade] = Number(r.cnt);
  }

  res.json(ordered.map((g) => ({ grade: g, count: map[g] ?? 0 })));
});

// GET /dashboard/department-stats
router.get("/dashboard/department-stats", async (_req, res) => {
  const rows = await db
    .select({
      department: studentsTable.department,
      studentCount: count(),
      averageMarks: avg(studentsTable.average),
    })
    .from(studentsTable)
    .groupBy(studentsTable.department)
    .orderBy(studentsTable.department);

  res.json(
    rows.map((r) => ({
      department: r.department,
      studentCount: Number(r.studentCount),
      averageMarks: r.averageMarks !== null ? Number(Number(r.averageMarks).toFixed(2)) : 0,
    }))
  );
});

// GET /dashboard/top-students
router.get("/dashboard/top-students", async (req, res) => {
  const parsed = GetTopStudentsQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : 5,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const limit = parsed.data.limit ?? 5;

  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.grade, "A"))
    .orderBy(desc(studentsTable.average))
    .limit(limit);

  res.json(
    students.map((s) => ({
      id: s.id,
      rollNumber: s.rollNumber,
      name: s.name,
      department: s.department,
      email: s.email ?? null,
      phone: s.phone ?? null,
      average: s.average !== null ? Number(s.average) : null,
      grade: s.grade ?? null,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

// GET /dashboard/fee-summary
router.get("/dashboard/fee-summary", async (_req, res) => {
  const [totals] = await db
    .select({
      totalFees: sum(feesTable.totalFee),
      totalPaid: sum(feesTable.paidAmount),
    })
    .from(feesTable);

  const statusRows = await db
    .select({ status: feesTable.status, cnt: count() })
    .from(feesTable)
    .groupBy(feesTable.status);

  const statusMap: Record<string, number> = { paid: 0, unpaid: 0, partial: 0 };
  for (const r of statusRows) {
    if (r.status in statusMap) statusMap[r.status] = Number(r.cnt);
  }

  const totalFees = totals.totalFees !== null ? Number(totals.totalFees) : 0;
  const totalPaid = totals.totalPaid !== null ? Number(totals.totalPaid) : 0;

  res.json({
    totalFees,
    totalPaid,
    totalOutstanding: totalFees - totalPaid,
    paidCount: statusMap["paid"],
    unpaidCount: statusMap["unpaid"],
    partialCount: statusMap["partial"],
  });
});

export default router;
