import fs from 'fs/promises';
import path from 'path';
import { getCollection,listCollection } from '../utils/db.js';
import { fileURLToPath } from 'url';

// Replicate __dirname functionality for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path to the 'data' directory relative to this utils file
const dataDir = path.resolve(__dirname, '../data');

export async function readQuestions(filename, defaultValue = []) {
    const filePath = path.join(dataDir, filename);
    try {
        await fs.access(filePath); // Check if file exists
        const rawData = await fs.readFile(filePath, 'utf-8');
        if (!rawData) {
            return defaultValue; // Return default if file is empty
        }
        return JSON.parse(rawData);
    } catch (error) {
        // If file doesn't exist (ENOENT) or other read errors occur, return default
        if (error.code === 'ENOENT') {
            console.log(`Data file ${filename} not found. Returning default value.`);
        } else {
            console.error(`Error reading data file ${filename}:`, error);
        }
        return defaultValue;
    }
}

export async function readData(collection) {
        
    return getCollection(collection);
}

export async function writeData(newUser,collection) {
    await collection.insertOne(newUser);
    return;
}
