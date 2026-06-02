import { Router } from "express";
import { db, studentsTable } from "@workspace/db";
import {
  ListStudentsQueryParams,
  CreateStudentBody,
  GetStudentParams,
  UpdateStudentParams,
  UpdateStudentBody,
  DeleteStudentParams,
} from "@workspace/api-zod";
import { eq, ilike, and, asc, desc, sql } from "drizzle-orm";

const router = Router();

function computeGrade(avg: number): string {
  if (avg >= 90) return "A";
  if (avg >= 75) return "B";
  if (avg >= 60) return "C";
  return "D";
}

function generateRollNumber(): string {
  const year = new Date().getFullYear().toString().slice(2);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SC${year}${rand}`;
}

function formatStudent(s: typeof studentsTable.$inferSelect) {
  return {
    id: s.id,
    rollNumber: s.rollNumber,
    name: s.name,
    department: s.department,
    email: s.email ?? null,
    phone: s.phone ?? null,
    average: s.average !== null ? Number(s.average) : null,
    grade: s.grade ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

// GET /students
router.get("/students", async (req, res) => {
  const parsed = ListStudentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { search, department, grade, sortBy, sortOrder } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${ilike(studentsTable.name, `%${search}%`)} OR ${ilike(studentsTable.rollNumber, `%${search}%`)})`
    );
  }
  if (department) conditions.push(eq(studentsTable.department, department));
  if (grade) conditions.push(eq(studentsTable.grade, grade));

  const where = conditions.length ? and(...conditions) : undefined;

  let orderBy;
  const dir = sortOrder === "asc" ? asc : desc;
  switch (sortBy) {
    case "average":
      orderBy = dir(studentsTable.average);
      break;
    case "rollNumber":
      orderBy = dir(studentsTable.rollNumber);
      break;
    case "createdAt":
      orderBy = dir(studentsTable.createdAt);
      break;
    default:
      orderBy = dir(studentsTable.name);
  }

  const students = await db
    .select()
    .from(studentsTable)
    .where(where)
    .orderBy(orderBy);

  res.json(students.map(formatStudent));
});

// POST /students
router.post("/students", async (req, res) => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  let rollNumber = generateRollNumber();
  // Ensure uniqueness
  let exists = await db.select().from(studentsTable).where(eq(studentsTable.rollNumber, rollNumber));
  while (exists.length > 0) {
    rollNumber = generateRollNumber();
    exists = await db.select().from(studentsTable).where(eq(studentsTable.rollNumber, rollNumber));
  }

  const [student] = await db
    .insert(studentsTable)
    .values({
      rollNumber,
      name: parsed.data.name,
      department: parsed.data.department,
      email: parsed.data.email,
      phone: parsed.data.phone,
    })
    .returning();

  res.status(201).json(formatStudent(student));
});

// GET /students/:id
router.get("/students/:id", async (req, res) => {
  const parsed = GetStudentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, parsed.data.id));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent(student));
});

// PUT /students/:id
router.put("/students/:id", async (req, res) => {
  const paramsParsed = UpdateStudentParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateStudentBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [student] = await db
    .update(studentsTable)
    .set({
      ...(bodyParsed.data.name && { name: bodyParsed.data.name }),
      ...(bodyParsed.data.department && { department: bodyParsed.data.department }),
      ...(bodyParsed.data.email !== undefined && { email: bodyParsed.data.email }),
      ...(bodyParsed.data.phone !== undefined && { phone: bodyParsed.data.phone }),
    })
    .where(eq(studentsTable.id, paramsParsed.data.id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent(student));
});

// DELETE /students/:id
router.delete("/students/:id", async (req, res) => {
  const parsed = DeleteStudentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(studentsTable).where(eq(studentsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
