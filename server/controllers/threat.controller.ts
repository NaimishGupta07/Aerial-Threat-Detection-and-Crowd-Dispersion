import { Request, Response } from "express";
import { execFile } from "child_process";
import path from "path";

export const runThreatDetection = (req: Request, res: Response) => {
  const img = req.body.image;
  if (!img) return res.status(400).json({ error: "Image not provided" });

  const scriptPath = path.join(__dirname, "../ml/threat_detector.py");
  const pythonPath = path.join(__dirname, "../venv/Scripts/python.exe");

  execFile(pythonPath, [scriptPath, img], { maxBuffer: 1024 * 1024 * 20 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(JSON.parse(stdout));
  });
};
