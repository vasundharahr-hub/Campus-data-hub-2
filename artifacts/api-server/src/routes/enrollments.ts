import { Router } from "express";
import { db, enrollmentsTable, studentsTable, coursesTable } from "@workspace/db";
import {
  ListEnrollmentsQueryParams,
  CreateEnrollmentBody,
  DeleteEnrollmentParams,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /enrollments
router.get("/enrollments", async (req, res) => {
  const parsed = ListEnrollmentsQueryParams.safeParse({
    studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
    courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const conditions = [];
  if (parsed.data.studentId) conditions.push(eq(enrollmentsTable.studentId, parsed.data.studentId));
  if (parsed.data.courseId) conditions.push(eq(enrollmentsTable.courseId, parsed.data.courseId));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: enrollmentsTable.id,
      studentId: enrollmentsTable.studentId,
      courseId: enrollmentsTable.courseId,
      studentName: studentsTable.name,
      courseName: coursesTable.name,
      courseCode: coursesTable.code,
      enrolledAt: enrollmentsTable.enrolledAt,
    })
    .from(enrollmentsTable)
    .leftJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(where)
    .orderBy(enrollmentsTable.enrolledAt);

  res.json(
    rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      courseId: r.courseId,
      studentName: r.studentName ?? null,
      courseName: r.courseName ?? null,
      courseCode: r.courseCode ?? null,
      enrolledAt: r.enrolledAt.toISOString(),
    }))
  );
});

// POST /enrollments
router.post("/enrollments", async (req, res) => {
  const parsed = CreateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({
      studentId: parsed.data.studentId,
      courseId: parsed.data.courseId,
    })
    .returning();

  const [row] = await db
    .select({
      id: enrollmentsTable.id,
      studentId: enrollmentsTable.studentId,
      courseId: enrollmentsTable.courseId,
      studentName: studentsTable.name,
      courseName: coursesTable.name,
      courseCode: coursesTable.code,
      enrolledAt: enrollmentsTable.enrolledAt,
    })
    .from(enrollmentsTable)
    .leftJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(eq(enrollmentsTable.id, enrollment.id));

  res.status(201).json({
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    studentName: row.studentName ?? null,
    courseName: row.courseName ?? null,
    courseCode: row.courseCode ?? null,
    enrolledAt: row.enrolledAt.toISOString(),
  });
});

// DELETE /enrollments/:id
router.delete("/enrollments/:id", async (req, res) => {
  const parsed = DeleteEnrollmentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(enrollmentsTable).where(eq(enrollmentsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
