import { MongoClient } from 'mongodb';

const uri = process.env.ATLAS_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in your .env file');
}

let client;
let db;

const connectDB = async () => {
    if (db) {
        return db;
    }
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(); 
        console.log("Successfully connected to MongoDB.");
        return db;
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1); // exit with failure
    }
};

const getDB = () => {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log("MongoDB connection closed.");
    }
};

export { connectDB, getDB, closeDB };