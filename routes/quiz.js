import express from 'express';
import { readData, writeData } from '../utils/dataUtils.js';
import { requireLogin } from '../utils/authMiddleware.js';

const router = express.Router();

// Apply requireLogin middleware to all quiz routes
router.use(requireLogin);

// GET quiz setup - Allow user to choose timer duration
router.get('/setup', (req, res) => {
  res.render('quiz_setup', {
    username: req.session.username
  });
});

// POST quiz start - Load and randomize questions
router.post('/start', async (req, res) => {
  try {
    const timerDuration = parseInt(req.body.timerDuration, 10) || 30; // Default to 30 seconds
    const questionCount = parseInt(req.body.questionCount, 10) || 10; // Default to 10 questions
    
    // Load questions from data file
    const questions = await readData('questions.json');
    
    if (!questions || questions.length === 0) {
      return res.render('error', { 
        username: req.session.username,
        message: 'No questions available',
        error: { status: 404 }
      });
    }
    
    // Randomize question order using Fisher-Yates shuffle algorithm
    const shuffledQuestions = [...questions];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }
    
    // Limit to the requested number of questions
    const limitedQuestions = shuffledQuestions.slice(0, Math.min(questionCount, shuffledQuestions.length));
    
    // Store quiz state in session
    req.session.quiz = {
      questions: limitedQuestions,
      currentIndex: 0,
      score: 0,
      totalQuestions: limitedQuestions.length,
      timerDuration,
      answers: [], // To store all answers for review in results
      startTime: Date.now()
    };
    
    // Redirect to first question
    res.redirect('/quiz/question');
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.render('error', {
      username: req.session.username,
      message: 'Failed to start quiz',
      error
    });
  }
});

// GET current question
router.get('/question', (req, res) => {
  const quizSession = req.session.quiz;
  
  if (!quizSession) {
    return res.redirect('/quiz/setup');
  }
  
  // Check if we've reached the end of the quiz
  if (quizSession.currentIndex >= quizSession.questions.length) {
    return res.redirect('/quiz/results');
  }
  
  const currentQuestion = quizSession.questions[quizSession.currentIndex];
  res.render('quiz_question', {
    username: req.session.username, // Pass username for header
    question: currentQuestion,
    questionNumber: quizSession.currentIndex + 1,
    totalQuestions: quizSession.totalQuestions,
    timerDuration: quizSession.timerDuration,
    feedback: null, // No feedback initially
    selectedAnswer: null // No selection initially
  });
});

// POST answer submission
router.post('/answer', async (req, res) => {
  const quizSession = req.session.quiz;
  
  if (!quizSession) {
    return res.redirect('/quiz/setup');
  }
  
  // Get current question
  const questionIndex = quizSession.currentIndex;
  const currentQuestion = quizSession.questions[questionIndex];
  
  // Get answer from form (A/B/C/D)
  const selectedAnswer = req.body.answer;
  const isTimeUp = req.body.timeUp === 'true';
  
  // Determine if answer is correct
  const isCorrect = !isTimeUp && selectedAnswer === currentQuestion.answer;
  
  // Update score
  if (isCorrect) {
    quizSession.score++;
  }
  
  // Store answer information
  quizSession.answers.push({
    questionId: currentQuestion.id || questionIndex,
    question: currentQuestion.question,
    selectedAnswer: isTimeUp ? '' : selectedAnswer,
    selectedOptionText: isTimeUp ? '' : currentQuestion[selectedAnswer], // Store the actual text of the selected option
    correctAnswer: currentQuestion.answer,
    correctOptionText: currentQuestion[currentQuestion.answer],
    isCorrect
  });
  
  // Move to the next question first
  quizSession.currentIndex++;
  
  // Is this now beyond the last question?
  const isLastQuestion = quizSession.currentIndex >= quizSession.questions.length;

  // Show feedback for the current question first
  if (req.body.showFeedback === 'true' && !isLastQuestion) {
    return res.render('quiz_question', {
      username: req.session.username,
      question: currentQuestion,
      questionNumber: quizSession.currentIndex,
      totalQuestions: quizSession.totalQuestions,
      timerDuration: quizSession.timerDuration,
      feedback: {
        isCorrect,
        selectedAnswer,
        correctAnswer: currentQuestion.answer,
        isTimeUp
      },
      selectedAnswer
    });
  }

  if (isLastQuestion) {
    return res.redirect('/quiz/results');
  }
  return res.redirect('/quiz/question');
});

// GET quiz results
router.get('/results', async (req, res) => {
  const quizSession = req.session.quiz;
  
  if (!quizSession) {
    return res.redirect('/quiz/setup');
  }
  
  // Save score to user's profile
  try {
    const users = await readData('users.json');
    const userIndex = users.findIndex(u => u.id === req.session.userId);
    
    if (userIndex !== -1) {
      const scoreRecord = {
        score: quizSession.score,
        totalQuestions: quizSession.totalQuestions,
        date: new Date().toISOString()
      };
      
      users[userIndex].scores.push(scoreRecord);
      await writeData('users.json', users);
    }
    
    // Render results page
    res.render('quiz_results', {
      username: req.session.username, // Pass username for header
      score: quizSession.score,
      totalQuestions: quizSession.totalQuestions,
      percentage: Math.round((quizSession.score / quizSession.totalQuestions) * 100),
      answers: quizSession.answers
    });
    
    // Clear quiz session data after showing results
    delete req.session.quiz;
  } catch (error) {
    console.error('Error saving quiz results:', error);
    res.render('error', {
      username: req.session.username,
      message: 'Failed to save quiz results',
      error
    });
  }
});

// GET user score history
router.get('/scores', async (req, res) => {
  try {
    const users = await readData('users.json');
    const user = users.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.redirect('/auth/logout');
    }
    
    res.render('score_history', {
      username: user.username,
      scores: user.scores
    });
  } catch (error) {
    console.error('Error fetching score history:', error);
    res.render('error', {
      message: 'Failed to fetch score history',
      error
    });
  }
});

export default router;
