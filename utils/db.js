import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();
const dbURL = process.env.ATLAS_URI; 

let db;
export async function connectToDB() {
  console.log(dbURL);
  try {
    const client = new MongoClient(dbURL, { useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('QuizApp');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export function getCollection(collectionName) {
  if (!db) {
    throw new Error('Database connection not established. Call connectToDB first.');
  }
  return db.collection(collectionName);
}
export function listCollection() {
  if (!db) {
    throw new Error('Database connection not established. Call connectToDB first.');
  }
  return db.listCollections();
}
