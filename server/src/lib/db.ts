import dns from 'node:dns';
import dotenv from 'dotenv';
import { MongoClient, type Db } from 'mongodb';

dotenv.config();

const dnsServers = process.env.DNS_SERVERS?.split(',').map((server) => server.trim()).filter(Boolean) ?? ['8.8.8.8', '1.1.1.1'];
dns.setServers(dnsServers);

// URI is checked lazily inside connectToDatabase so the server can
// start and serve fallback 503 responses even when MongoDB is not configured.
const dbName = process.env.MONGODB_DB ?? process.env.MONGODB_DATABASE ?? 'typinghero';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Progress routes will return 503.');
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      db = client.db(dbName);
      return db;
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

export async function getDatabase() {
  return connectToDatabase();
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
