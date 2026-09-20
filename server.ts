import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { apiRouter } from "./server/apiRouter";
import { connectToDatabase } from "./server/db";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Basic middlewares
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Security & Cache headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  // Connect to MongoDB Atlas (No temporary data or initial sample seeding)
  connectToDatabase()
    .then(() => {
      console.log("Connected to MongoDB Atlas successfully (Live database active)");
    })
    .catch((err) => {
      console.warn("MongoDB connection notice:", err.message);
    });

  // Mount API Router for all /api endpoints
  app.use("/api", apiRouter);

  // Vite middleware setup (SPA fallback for frontend)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UP HomeGaurd Shahjahanpur server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
