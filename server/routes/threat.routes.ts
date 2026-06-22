import { Router } from "express";
import { runThreatDetection } from "../controllers/threat.controller";

const router = Router();
router.post("/threat-detect", runThreatDetection);
export default router;
