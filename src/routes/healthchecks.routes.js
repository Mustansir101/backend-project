import Router from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";

const router = Router();

router.route("/").get(healthcheck); // "/" = /api/v1/healthcheck

export default router;
