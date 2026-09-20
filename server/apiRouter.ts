import { Router, Request, Response } from "express";
import { connectToDatabase } from "./db";
import { OFFICIAL_CUTOFFS, getCutoff } from "./cutoffs";

export const apiRouter = Router();

// 1. Cutoffs Endpoint
apiRouter.get("/cutoffs", async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      cutoffs: OFFICIAL_CUTOFFS,
      district: "Shahjahanpur",
      state: "Uttar Pradesh",
      department: "UP Home Guard",
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Also match /api/cutoffs directly if mounted at root
apiRouter.get("/api/cutoffs", (req: Request, res: Response) => {
  return res.json({
    success: true,
    cutoffs: OFFICIAL_CUTOFFS,
    district: "Shahjahanpur",
    state: "Uttar Pradesh",
    department: "UP Home Guard",
  });
});

// 2. Candidates List Endpoint (Only Real Candidate Data from MongoDB Database)
async function handleGetCandidates(req: Request, res: Response) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("candidates");

    // Fetch only genuine user submissions from MongoDB database
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Clean up _id for client consumption
    const candidates = docs.map((doc) => ({
      id: doc.id || String(doc._id),
      name: doc.name,
      gender: doc.gender,
      category: doc.category,
      shift: doc.shift || "1st – 25 April",
      marks: Number(doc.marks),
      cutoff: Number(doc.cutoff),
      extra: Number(doc.extra),
      normalization: doc.normalization || "0.00",
      createdAt: doc.createdAt || new Date().toISOString(),
    }));

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.json({
      success: true,
      total: candidates.length,
      candidates,
      dbConnected: true,
    });
  } catch (err: any) {
    console.error("Error fetching candidates from database:", err);
    return res.status(500).json({
      success: false,
      message: "Database error fetching candidates",
      candidates: [],
      error: err.message,
    });
  }
}

apiRouter.get("/candidates", handleGetCandidates);
apiRouter.get("/api/candidates", handleGetCandidates);

// 3. Candidate Submission Endpoint (Direct persistence to MongoDB Atlas)
async function handlePostCandidate(req: Request, res: Response) {
  try {
    const { name, gender, category, shift, marks, extra, normalization } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "कृपया अभ्यर्थी का नाम दर्ज करें (Candidate name required)." });
    }

    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.status(400).json({ success: false, message: "कृपया मान्य लिंग चुनें (Valid gender required)." });
    }

    if (!category || !["UR", "EWS", "OBC", "SC", "ST"].includes(category)) {
      return res.status(400).json({ success: false, message: "कृपया मान्य श्रेणी चुनें (Valid category required)." });
    }

    const parsedMarks = parseFloat(marks);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
      return res.status(400).json({ success: false, message: "कृपया 0 से 100 के बीच प्राप्तांक दर्ज करें (Marks must be 0-100)." });
    }

    const cutoffValue = getCutoff(category, gender);

    // Compute extra marks difference from official benchmark
    let calculatedExtra: number;
    if (extra !== undefined && extra !== null && extra !== "" && !isNaN(parseFloat(extra))) {
      calculatedExtra = parseFloat(Number(extra).toFixed(5));
    } else {
      calculatedExtra = parseFloat((parsedMarks - cutoffValue).toFixed(5));
    }

    const newCandidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      gender,
      category,
      shift: shift && String(shift).trim() ? String(shift).trim() : "1st – 25 April",
      marks: parseFloat(parsedMarks.toFixed(5)),
      cutoff: cutoffValue,
      extra: calculatedExtra,
      normalization: normalization !== undefined && normalization !== null && !isNaN(parseFloat(String(normalization)))
        ? parseFloat(String(normalization)).toFixed(2)
        : "0.00",
      createdAt: new Date().toISOString(),
    };

    // Save directly to MongoDB Atlas
    const { db } = await connectToDatabase();
    await db.collection("candidates").insertOne(newCandidate);

    return res.status(201).json({
      success: true,
      message: "अभ्यर्थी का डेटा डेटाबेस में सफलतापूर्वक दर्ज हुआ!",
      candidate: newCandidate,
    });
  } catch (err: any) {
    console.error("Database save error:", err);
    return res.status(500).json({
      success: false,
      message: "डेटाबेस में सहेजने में विफल। कृपया पुनः प्रयास करें।",
      error: err.message,
    });
  }
}

apiRouter.post("/candidates", handlePostCandidate);
apiRouter.post("/api/candidates", handlePostCandidate);

// 4. Statistics Endpoint (Aggregated from live MongoDB database)
async function handleGetStats(req: Request, res: Response) {
  try {
    const { db } = await connectToDatabase();
    const docs = await db.collection("candidates").find({}).toArray();

    const total = docs.length;
    if (total === 0) {
      return res.json({
        success: true,
        stats: {
          total: 0,
          avgMarks: 0,
          maxMarks: 0,
          minMarks: 0,
          aboveCutoffCount: 0,
          belowCutoffCount: 0,
          categoryCounts: { UR: 0, EWS: 0, OBC: 0, SC: 0, ST: 0 },
          genderCounts: { Male: 0, Female: 0 },
        },
      });
    }

    let marksSum = 0;
    let maxMarks = -Infinity;
    let minMarks = Infinity;
    let aboveCutoffCount = 0;
    let belowCutoffCount = 0;

    const categoryCounts: Record<string, number> = { UR: 0, EWS: 0, OBC: 0, SC: 0, ST: 0 };
    const genderCounts: Record<string, number> = { Male: 0, Female: 0 };

    for (const c of docs) {
      const marks = Number(c.marks);
      const extra = Number(c.extra);
      marksSum += marks;
      if (marks > maxMarks) maxMarks = marks;
      if (marks < minMarks) minMarks = marks;
      if (extra >= 0) aboveCutoffCount++;
      else belowCutoffCount++;

      if (c.category && categoryCounts[c.category] !== undefined) {
        categoryCounts[c.category]++;
      }
      if (c.gender && genderCounts[c.gender] !== undefined) {
        genderCounts[c.gender]++;
      }
    }

    const avgMarks = Number((marksSum / total).toFixed(2));

    return res.json({
      success: true,
      stats: {
        total,
        avgMarks,
        maxMarks: maxMarks === -Infinity ? 0 : Number(maxMarks.toFixed(2)),
        minMarks: minMarks === Infinity ? 0 : Number(minMarks.toFixed(2)),
        aboveCutoffCount,
        belowCutoffCount,
        categoryCounts,
        genderCounts,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Stats error", error: err.message });
  }
}

apiRouter.get("/stats", handleGetStats);
apiRouter.get("/api/stats", handleGetStats);

// 5. Delete candidate endpoint
async function handleDeleteCandidate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { db } = await connectToDatabase();
    await db.collection("candidates").deleteOne({ id });
    return res.json({ success: true, message: "Candidate deleted successfully from database" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Failed to delete candidate", error: err.message });
  }
}

apiRouter.delete("/candidates/:id", handleDeleteCandidate);
apiRouter.delete("/api/candidates/:id", handleDeleteCandidate);

// 6. Health & Database connectivity check
async function handleHealthCheck(req: Request, res: Response) {
  try {
    const { db } = await connectToDatabase();
    const count = await db.collection("candidates").countDocuments();
    return res.json({
      status: "ok",
      database: "MongoDB Atlas Connected",
      candidatesInDatabase: count,
      district: "Shahjahanpur",
    });
  } catch (err: any) {
    return res.json({
      status: "database_connecting",
      database: "Reconnecting to MongoDB Atlas",
      error: err.message,
    });
  }
}

apiRouter.get("/health", handleHealthCheck);
apiRouter.get("/api/health", handleHealthCheck);
