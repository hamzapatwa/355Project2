import { MongoClient } from 'mongodb';

import dotenv from 'dotenv';
dotenv.config();
const dbURL = process.env.ATLAS_URI;

const uri = process.env.ATLAS_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in your .env file');
}

let client;
let db;

const connectToDB = async () => {
    if (db) {
        console.log("Database connection already established."); // Added log
        return db;
    }
    try {
        console.log("Attempting to connect to MongoDB..."); // Added log
        client = new MongoClient(uri);
        await client.connect();
        db = client.db();
        console.log("Successfully connected to MongoDB."); // Existing log
        return db;
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1); // exit with failure
    }
};

const getDB = () => {
    if (!db) {
        throw new Error("Database not initialized. Call connectToDB first.");
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log("MongoDB connection closed.");
    }
};




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

export { connectToDB, getDB, closeDB };