import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Avdhesh1:ya4XYnQUEtYhv5kr@cluster0.0uojesi.mongodb.net/homegarud";

const DB_NAME = "homegarud";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
      maxPoolSize: 20,
    });
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export function getMongoClient(): MongoClient | null {
  return cachedClient;
}
