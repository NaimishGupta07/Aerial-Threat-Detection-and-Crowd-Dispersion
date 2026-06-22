import { Router } from "express";
import { runCrowdAnalysis } from "../controllers/crowd.controller";

const router = Router();
router.post("/crowd-analysis", runCrowdAnalysis);
export default router;
