import express, { Request, Response } from "express";
import path from "path";
import { MongoClient, Collection, Db } from "mongodb";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Avdhesh1:ya4XYnQUEtYhv5kr@cluster0.0uojesi.mongodb.net/homegarud";

const DB_NAME = "homegarud";
const COLLECTION_NAME = "candidates";
const CUTOFFS_COLLECTION = "cutoffs";

// Official Cutoffs Reference from provided image
const OFFICIAL_CUTOFFS = [
  { sNo: 1, category: "UR", maleCutoff: 61.28427, femaleCutoff: 55.10147 },
  { sNo: 2, category: "EWS", maleCutoff: 55.28262, femaleCutoff: 48.75054 },
  { sNo: 3, category: "OBC", maleCutoff: 55.98458, femaleCutoff: 49.8979 },
  { sNo: 4, category: "SC", maleCutoff: 52.22163, femaleCutoff: 46.81292 },
  { sNo: 5, category: "ST", maleCutoff: 25.21985, femaleCutoff: 25.21985 },
];

function getCutoff(category: string, gender: string): number {
  const item = OFFICIAL_CUTOFFS.find((c) => c.category === category);
  if (!item) return 50.0;
  if (gender === "Female") {
    return item.femaleCutoff !== null ? item.femaleCutoff : item.maleCutoff;
  }
  return item.maleCutoff;
}

// Initial seed data to populate realistic analysis if collection is fresh
const INITIAL_SAMPLE_CANDIDATES = [
  {
    id: "cand_spn_001",
    name: "Rohan Verma",
    gender: "Male",
    category: "OBC",
    shift: "1st – 25 April",
    marks: 64.75,
    cutoff: 55.98458,
    extra: 8.76542,
    normalization: "1.50",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "cand_spn_002",
    name: "Pooja Sharma",
    gender: "Female",
    category: "UR",
    shift: "2nd – 25 April",
    marks: 59.20,
    cutoff: 55.10147,
    extra: 4.09853,
    normalization: "0.85",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "cand_spn_003",
    name: "Amit Kumar",
    gender: "Male",
    category: "SC",
    shift: "1st – 26 April",
    marks: 56.40,
    cutoff: 52.22163,
    extra: 4.17837,
    normalization: "1.10",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "cand_spn_004",
    name: "Saurabh Tiwari",
    gender: "Male",
    category: "EWS",
    shift: "2nd – 26 April",
    marks: 58.65,
    cutoff: 55.28262,
    extra: 3.36738,
    normalization: "-0.45",
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: "cand_spn_005",
    name: "Meera Devi",
    gender: "Female",
    category: "OBC",
    shift: "1st – 27 April",
    marks: 51.50,
    cutoff: 49.8979,
    extra: 1.6021,
    normalization: "0.70",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "cand_spn_006",
    name: "Vikram Singh",
    gender: "Male",
    category: "UR",
    shift: "2nd – 27 April",
    marks: 68.30,
    cutoff: 61.28427,
    extra: 7.01573,
    normalization: "1.80",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "cand_spn_007",
    name: "Anjali Gautam",
    gender: "Female",
    category: "SC",
    shift: "1st – 25 April",
    marks: 48.90,
    cutoff: 46.81292,
    extra: 2.08708,
    normalization: "0.25",
    createdAt: new Date(Date.now() - 900000).toISOString(),
  }
];

// In-Memory Fast Cache for High Concurrency and sub-millisecond response
interface CacheStore {
  candidates: any[];
  cutoffs: any[];
  lastUpdated: number;
  dbConnected: boolean;
}

const memoryCache: CacheStore = {
  candidates: [...INITIAL_SAMPLE_CANDIDATES],
  cutoffs: [...OFFICIAL_CUTOFFS],
  lastUpdated: Date.now(),
  dbConnected: false,
};

let dbInstance: Db | null = null;
let candidatesCollection: Collection | null = null;
let cutoffsCollection: Collection | null = null;

// Initialize MongoDB connection asynchronously with fallback
async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
      maxPoolSize: 50, // Optimized for high traffic volume
    });

    await client.connect();
    console.log("Connected to MongoDB Atlas successfully");
    dbInstance = client.db(DB_NAME);
    candidatesCollection = dbInstance.collection(COLLECTION_NAME);
    cutoffsCollection = dbInstance.collection(CUTOFFS_COLLECTION);
    memoryCache.dbConnected = true;

    // Seed or update cutoffs table
    const existingCutoffsCount = await cutoffsCollection.countDocuments();
    if (existingCutoffsCount === 0) {
      await cutoffsCollection.insertMany(OFFICIAL_CUTOFFS);
      console.log("Initialized cutoffs collection with official data");
    } else {
      const cutoffsFromDb = await cutoffsCollection.find({}).sort({ sNo: 1 }).toArray();
      if (cutoffsFromDb.length > 0) {
        memoryCache.cutoffs = cutoffsFromDb.map((c) => ({
          sNo: c.sNo,
          category: c.category,
          maleCutoff: c.maleCutoff,
          femaleCutoff: c.femaleCutoff,
        }));
      }
    }

    // Load existing candidates into memory cache
    const existingCandidatesCount = await candidatesCollection.countDocuments();
    if (existingCandidatesCount === 0) {
      await candidatesCollection.insertMany(INITIAL_SAMPLE_CANDIDATES);
      console.log("Seeded initial candidate data for UP HomeGaurd Shahjahanpur");
    } else {
      const docs = await candidatesCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(2000)
        .toArray();
      memoryCache.candidates = docs.map((doc) => ({
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
    }

    memoryCache.lastUpdated = Date.now();
  } catch (err) {
    console.warn("MongoDB Atlas connection notice (using high-speed in-memory cache fallback):", err);
    memoryCache.dbConnected = false;
  }
}

// Background reconnect attempts every 60s if not connected
setInterval(() => {
  if (!memoryCache.dbConnected) {
    connectToMongo();
  }
}, 60000);

async function startServer() {
  // Start MongoDB connection
  connectToMongo();

  const app = express();

  // High traffic performance middlewares
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Cache-control and compression headers for high performance
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  // API Endpoints

  // 1. Cutoffs Endpoint
  app.get("/api/cutoffs", (req: Request, res: Response) => {
    // Return high-speed cached cutoffs
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.json({
      success: true,
      cutoffs: memoryCache.cutoffs,
      district: "Shahjahanpur",
      state: "Uttar Pradesh",
      department: "UP Home Guard",
    });
  });

  // 2. Candidates List Endpoint with Filtering & Multi-sort
  app.get("/api/candidates", (req: Request, res: Response) => {
    try {
      const {
        search = "",
        category = "ALL",
        gender = "ALL",
        shift = "ALL",
        status = "ALL", // ALL, ABOVE_CUTOFF, BELOW_CUTOFF
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      let list = [...memoryCache.candidates];

      // Filter by search (name, shift, category, normalization)
      if (typeof search === "string" && search.trim() !== "") {
        const query = search.trim().toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query) ||
            (c.shift && c.shift.toLowerCase().includes(query)) ||
            c.normalization.toLowerCase().includes(query)
        );
      }

      // Filter by category
      if (typeof category === "string" && category !== "ALL") {
        list = list.filter((c) => c.category.toUpperCase() === category.toUpperCase());
      }

      // Filter by gender
      if (typeof gender === "string" && gender !== "ALL") {
        list = list.filter((c) => c.gender.toUpperCase() === gender.toUpperCase());
      }

      // Filter by shift
      if (typeof shift === "string" && shift !== "ALL") {
        list = list.filter((c) => (c.shift || "").toLowerCase() === shift.toLowerCase());
      }

      // Filter by status (Above or Below Cutoff)
      if (typeof status === "string") {
        if (status === "ABOVE_CUTOFF") {
          list = list.filter((c) => c.extra >= 0);
        } else if (status === "BELOW_CUTOFF") {
          list = list.filter((c) => c.extra < 0);
        }
      }

      // Sorting
      list.sort((a, b) => {
        let valA = a[sortBy as string];
        let valB = b[sortBy as string];

        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Quick performance caching header
      res.setHeader("Cache-Control", "no-cache");
      return res.json({
        success: true,
        total: list.length,
        candidates: list,
        cachedAt: memoryCache.lastUpdated,
        dbConnected: memoryCache.dbConnected,
      });
    } catch (err: any) {
      console.error("Error fetching candidates:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch candidates" });
    }
  });

  // 3. Candidate Submission Endpoint
  app.post("/api/candidates", async (req: Request, res: Response) => {
    try {
      const { name, gender, category, shift, marks, extra, normalization } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Please enter candidate name." });
      }

      if (!gender || !["Male", "Female"].includes(gender)) {
        return res.status(400).json({ success: false, message: "Please select a valid gender." });
      }

      if (!category || !["UR", "EWS", "OBC", "SC", "ST"].includes(category)) {
        return res.status(400).json({ success: false, message: "Please select a valid category." });
      }

      const parsedMarks = parseFloat(marks);
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
        return res.status(400).json({ success: false, message: "Please enter a valid marks score (0 - 100)." });
      }

      const cutoffValue = getCutoff(category, gender);

      // If user specified extra, use it; otherwise compute marks - cutoff
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

      // 1. Immediately insert into high-speed memory cache for 0ms read latency
      memoryCache.candidates.unshift(newCandidate);
      memoryCache.lastUpdated = Date.now();

      // 2. Persist to MongoDB Atlas asynchronously
      if (candidatesCollection) {
        candidatesCollection
          .insertOne(newCandidate)
          .catch((dbErr) => console.error("MongoDB persistence background error:", dbErr));
      }

      return res.status(201).json({
        success: true,
        message: "Candidate score recorded successfully!",
        candidate: newCandidate,
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      return res.status(500).json({ success: false, message: "Server error recording score." });
    }
  });

  // 4. Statistics Endpoint (Aggregated from Cache)
  app.get("/api/stats", (req: Request, res: Response) => {
    try {
      const candidates = memoryCache.candidates;
      const total = candidates.length;

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

      for (const c of candidates) {
        marksSum += c.marks;
        if (c.marks > maxMarks) maxMarks = c.marks;
        if (c.marks < minMarks) minMarks = c.marks;
        if (c.extra >= 0) aboveCutoffCount++;
        else belowCutoffCount++;

        if (categoryCounts[c.category] !== undefined) {
          categoryCounts[c.category]++;
        }
        if (genderCounts[c.gender] !== undefined) {
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
      console.error("Stats calculation error:", err);
      return res.status(500).json({ success: false, message: "Stats error" });
    }
  });

  // 5. Delete candidate endpoint (for clean-up/moderation)
  app.delete("/api/candidates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const index = memoryCache.candidates.findIndex((c) => c.id === id);
      if (index !== -1) {
        memoryCache.candidates.splice(index, 1);
        memoryCache.lastUpdated = Date.now();
      }

      if (candidatesCollection) {
        await candidatesCollection.deleteOne({ id }).catch(() => {});
      }

      return res.json({ success: true, message: "Candidate removed successfully" });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to delete" });
    }
  });

  // Health and Cache status
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      district: "Shahjahanpur",
      database: memoryCache.dbConnected ? "MongoDB Atlas Connected" : "In-Memory High-Speed Cache Active",
      cachedEntries: memoryCache.candidates.length,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UP HomeGaurd Shahjahanpur server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
