import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname functionality for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path to the 'data' directory relative to this utils file
const dataDir = path.resolve(__dirname, '../data');

/**
 * Reads JSON data from a file within the 'data' directory.
 * If the file doesn't exist, it returns a default value (usually an empty array).
 * @param {string} filename - The name of the JSON file (e.g., 'users.json').
 * @param {any} defaultValue - The value to return if the file doesn't exist or is empty/invalid.
 * @returns {Promise<any>} A promise that resolves with the parsed JSON data or the default value.
 */
export async function readData(filename, defaultValue = []) {
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

/**
 * Writes JSON data to a file within the 'data' directory.
 * Ensures the 'data' directory exists.
 * @param {string} filename - The name of the JSON file (e.g., 'users.json').
 * @param {any} data - The data to write (should be JSON-serializable).
 * @returns {Promise<void>} A promise that resolves when the data has been written.
 */
export async function writeData(filename, data) {
    const filePath = path.join(dataDir, filename);
    try {
        // Ensure the data directory exists
        await fs.mkdir(dataDir, { recursive: true });
        // Write the file
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8'); // Pretty print JSON
    } catch (error) {
        console.error(`Error writing data file ${filename}:`, error);
        // Re-throw the error to indicate failure
        throw error;
    }
}
