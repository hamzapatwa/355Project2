# QuizBlox

A full-stack quiz application built with Express.js, MongoDB, and EJS templating engine.

# Group Members
- Anthony He
- Hamza Patwa
- Justin Weng
- Arun Kanhai

## Features

| Feature | Contributer(s) |
|-------------------------------------|-----|
| Timer and Selecting Number of Questions | Anthony, Hamza |
| Random Multiple-choice Questions with Feedback | Anthony, Hamza, Arun, Justin |
| Score tracking, History and Take Multiple Quizes | Hamza, Justin, Arun |
| Responsive design with modern CSS | Hamza, Justin, Arun |
| MongoDB Integration for Data Persistence | Hamza, Justin, Anthony |
| Score Sharing and Export Functionality | Hamza |
| Global Leaderboard with Filtering | Hamza |
| Detailed Quiz History and Statistics | Hamza, Justin |
| Performance Analytics and Progress Tracking | Hamza, Justin |

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Templating**: EJS
- **Database**: MongoDB
- **Additional Tools**:
  - Axios for HTTP requests
  - HTML-to-Image for score sharing
  - bcrypt for password hashing
  - Express-session for session management

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your MongoDB connection string: `MONGODB_URI=your_mongodb_uri`
   - Add session secret: `SESSION_SECRET=your_session_secret`
4. Start the development server:
```bash
npm run dev
```
5. Open your browser and navigate to `http://localhost:3000`

## User Instructions

### Authentication
- Register with a username and password
- Login with your credentials
- View and manage your profile information

### Taking a Quiz
1. After logging in, customize your quiz:
   - Select number of questions (5-25)
   - Choose a category (or any category)
   - Set difficulty level (Easy, Medium, Hard, or Any)
   - Set timer duration per question (10-60 seconds)
2. Answer each question before the timer runs out
3. Receive immediate feedback on your answers (✅ correct, ❌ incorrect)
4. View your final score and detailed question review
5. Share your score card with others
6. Check your score history and statistics

### Score History and Statistics
- View detailed quiz history with dates and scores
- Track your performance over time
- See average scores and best performances
- Filter and sort quiz attempts
- View category-wise performance

### Leaderboard
- Compete with other users globally
- Filter leaderboard by category and difficulty
- Track your ranking and progress
- View top performers in each category

## Project Structure

- `server.js` - Main application entry point
- `routes/` - Express route handlers
- `views/` - EJS templates
- `public/` - Static assets (CSS, client-side JavaScript)
- `utils/` - Utility functions
- `models/` - MongoDB schema definitions
- `controllers/` - Business logic handlers

## Development

Run the development server with auto-restart on file changes:
```bash
npm run dev
```

## Production

Start the production server:
```bash
npm start
```

## Environment Variables

The following environment variables are required:
- `MONGODB_URI`: Your MongoDB connection string
- `SESSION_SECRET`: Secret key for session management
