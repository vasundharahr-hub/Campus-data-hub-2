import { Router } from "express";
import { db, coursesTable } from "@workspace/db";
import {
  CreateCourseBody,
  GetCourseParams,
  DeleteCourseParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

function formatCourse(c: typeof coursesTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description ?? null,
    credits: c.credits ?? null,
    instructor: c.instructor ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

// GET /courses
router.get("/courses", async (_req, res) => {
  const courses = await db.select().from(coursesTable).orderBy(coursesTable.name);
  res.json(courses.map(formatCourse));
});

// POST /courses
router.post("/courses", async (req, res) => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [course] = await db
    .insert(coursesTable)
    .values({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      credits: parsed.data.credits,
      instructor: parsed.data.instructor,
    })
    .returning();

  res.status(201).json(formatCourse(course));
});

// GET /courses/:id
router.get("/courses/:id", async (req, res) => {
  const parsed = GetCourseParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, parsed.data.id));

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(formatCourse(course));
});

// DELETE /courses/:id
router.delete("/courses/:id", async (req, res) => {
  const parsed = DeleteCourseParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(coursesTable).where(eq(coursesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
