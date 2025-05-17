# QuizBlox

A full-stack quiz application built with Express.js and EJS templating engine.

# Group Members
- Anthony He
- Hamza Patwa
- Justin Weng
- Arun Kanhai
## Features Project 2

| Feature | Contributer(s) |
|-------------------------------------|-----|
| User Authentication (Login/Signup) | Hamza |
| Timer and Selecting Number of Questions | Anthony, Hamza |
| Random Multiple-choice Questions with Feedback | Anthony, Hamza, Arun, Justin |

## Features Project 3
| Feature | Contributer(s) |
|-------------------------------------|-----|
| Score tracking, History and Leaderboard | Hamza, Justin, Arun |
| Improved UI and Design | Hamza, Justin, Arun |
| Save User Data onto MongoDB | Anthony, Hamza |
| Trivia API for Questions and Share Feature| Hamza |
| User Profile with Minecraft Profile Picture Generation | Hamza, Justin, Anthony |

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Templating**: EJS
- **Data Storage**: MongoDB
- **External APIs**: Minotar API for Minecraft profile pictures

## Installation

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
npm run dev
```
4. Open your browser and navigate to `http://localhost:3000`

## User Instructions

### Authentication
- Register with a username and password
- Login with your credentials

### Taking a Quiz
1. After logging in, set your preferred timer duration
2. Answer each question before the timer runs out
3. Receive immediate feedback on your answers (✅ correct, ❌ incorrect)
4. View your final score and question review at the end
5. Check your score history in the "My Scores" section

### Profile Pictures
- Users can set their profile picture using their Minecraft username
- Profile pictures are automatically fetched from the Minotar API
- Pictures are displayed in the user profile and score history

## Project Structure

- `server.js` - Main application entry point
- `routes/` - Express route handlers
- `views/` - EJS templates
- `public/` - Static assets (CSS, client-side JavaScript)
- `utils/` - Utility functions

## Development

Run the development server with auto-restart on file changes:
```
npm run dev
```

## Production

Start the production server:
```
npm start
```
