import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import customersRouter from "./customers";
import sitesRouter from "./sites";
import assetsRouter from "./assets";
import equipmentRouter from "./equipment";
import workOrdersRouter from "./work_orders";
import developerProjectsRouter from "./developer_projects";
import housingUnitsRouter from "./housing_units";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(customersRouter);
router.use(sitesRouter);
router.use(assetsRouter);
router.use(equipmentRouter);
router.use(workOrdersRouter);
router.use(developerProjectsRouter);
router.use(housingUnitsRouter);

export default router;
