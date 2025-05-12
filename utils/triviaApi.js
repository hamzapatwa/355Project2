import axios from 'axios';

const API_BASE_URL = 'https://opentdb.com';

/**
 * Fetches the list of quiz categories from the Open Trivia Database.
 * @returns {Promise<Array<{id: number, name: string}>>} A promise that resolves to an array of category objects.
 */
export async function fetchCategories() {
    try {
        const response = await axios.get(`${API_BASE_URL}/api_category.php`);
        if (response.data && response.data.trivia_categories) {
            return response.data.trivia_categories;
        }
        console.error('Failed to fetch categories: Invalid API response format', response.data);
        return []; // Return empty array on failure or bad format
    } catch (error) {
        console.error('Error fetching categories from OpenTDB:', error.message);
        // Consider how to handle this in the UI, e.g., show an error or use a default category
        return []; // Return empty array on network or other errors
    }
}

/**
 * Fetches quiz questions from the Open Trivia Database.
 * @param {number} amount - The number of questions to fetch.
 * @param {number|string} [category] - The category ID. Optional.
 * @param {string} [difficulty] - The difficulty level ('easy', 'medium', 'hard'). Optional.
 * @param {string} [type] - The type of questions ('multiple', 'boolean'). Optional.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of question objects.
 */
export async function fetchQuestions(amount, category, difficulty, type = 'multiple') {
    const params = {
        amount,
        encode: 'url3986' // Use URL encoding to handle special characters
    };
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    if (type) params.type = type;

    try {
        const response = await axios.get(`${API_BASE_URL}/api.php`, { params });
        if (response.data && response.data.response_code === 0 && response.data.results) {
            // Decode question, correct_answer, and incorrect_answers
            return response.data.results.map(q => ({
                ...q,
                question: decodeURIComponent(q.question),
                correct_answer: decodeURIComponent(q.correct_answer),
                incorrect_answers: q.incorrect_answers.map(ia => decodeURIComponent(ia))
            }));
        } else if (response.data && response.data.response_code !== 0) {
            console.error(`API Error Code ${response.data.response_code}: Could not return results. The API doesn't have enough questions for your query.`);
            // response_code: 1 (No Results), 2 (Invalid Parameter), 3 (Token Not Found), 4 (Token Empty)
            return []; // Return empty if API indicates an issue (e.g., not enough questions)
        }
        console.error('Failed to fetch questions: Invalid API response format', response.data);
        return [];
    } catch (error) {
        console.error('Error fetching questions from OpenTDB:', error.message);
        return [];
    }
}