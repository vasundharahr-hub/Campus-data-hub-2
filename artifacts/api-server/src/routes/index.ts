import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import coursesRouter from "./courses";
import enrollmentsRouter from "./enrollments";
import feesRouter from "./fees";
import performanceRouter from "./performance";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(coursesRouter);
router.use(enrollmentsRouter);
router.use(feesRouter);
router.use(performanceRouter);
router.use(dashboardRouter);

export default router;
