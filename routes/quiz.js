import express from 'express';
import { requireLogin } from '../utils/authMiddleware.js';
import { fetchCategories, fetchQuestions } from '../utils/triviaApi.js';
import { getDB } from '../utils/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Apply requireLogin middleware to all quiz routes
router.use(requireLogin);

// GET quiz setup - user chooses timer duration, category, and difficulty
router.get('/setup', async (req, res) => {
  try {
    const categories = await fetchCategories();
  res.render('quiz_setup', {
    username: req.session.username,
      categories: categories || [], // Pass empty array if fetching fails
      error: null
    });
  } catch (error) {
    console.error('Error fetching categories for quiz setup:', error);
    res.render('quiz_setup', {
      username: req.session.username,
      categories: [],
      error: 'Failed to load quiz categories. Please try again.'
  });
  }
});

// POST quiz start - Fetch questions from API and set up quiz
router.post('/start', async (req, res) => {
  try {
    const {
      questionCount: countStr,
      category: categoryId, // This will be the ID from the form
      difficulty,
      timerDuration: timerDurationStr
    } = req.body;

    const questionCount = parseInt(countStr, 10) || 10;
    const timerDuration = parseInt(timerDurationStr, 10) || 30;

    // Fetch questions from API
    const apiQuestions = await fetchQuestions(questionCount, categoryId || null, difficulty || null);

    if (!apiQuestions || apiQuestions.length === 0) {
      // Attempt to fetch categories again to display on the setup page with an error
      const categories = await fetchCategories();
      return res.render('quiz_setup', {
        username: req.session.username,
        categories: categories || [],
        error: 'Could not fetch questions for the selected criteria. Please try different options or try again later.'
      });
    }

    // Transform questions for the EJS template and session
    const processedQuestions = apiQuestions.map((q, index) => {
      const options = [...q.incorrect_answers, q.correct_answer];
      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

      // Map shuffled options to A, B, C, D and find the key for the correct answer
      const optionMap = {};
      let correctAnswerKey = '';
      const optionKeys = ['A', 'B', 'C', 'D'];
      options.forEach((opt, idx) => {
        const key = optionKeys[idx];
        optionMap[key] = opt;
        if (opt === q.correct_answer) {
          correctAnswerKey = key;
        }
      });

      return {
        id: `api_q_${index}`,
        question: q.question, // Already decoded in fetchQuestions
        ...optionMap, // A, B, C, D properties
        answer: correctAnswerKey, // The key (A,B,C,D) of the correct answer
        original_correct_answer_text: q.correct_answer // Store original text for reference if needed
      };
    });

    // Find category name if an ID was provided
    let categoryName = 'Any';
    if (categoryId) {
        const allCategories = await fetchCategories(); // Fetch again or cache earlier
        const selectedCategoryObj = allCategories.find(cat => cat.id.toString() === categoryId.toString());
        if (selectedCategoryObj) {
            categoryName = selectedCategoryObj.name;
        }
    }

    // Store quiz state in session
    req.session.quiz = {
      questions: processedQuestions,
      currentIndex: 0,
      score: 0,
      totalQuestions: processedQuestions.length,
      timerDuration,
      answers: [],
      startTime: Date.now(),
      categoryId: categoryId || null,
      categoryName: categoryName,
      difficulty: difficulty || 'Any'
    };

    res.redirect('/quiz/question');
  } catch (error) {
    console.error('Error starting quiz:', error);
    // Attempt to fetch categories again to display on the setup page with an error
    let categoriesForErrorPage = [];
    try {
        categoriesForErrorPage = await fetchCategories();
    } catch (catError) {
        console.error('Could not fetch categories for error display:', catError);
    }
    res.status(500).render('quiz_setup', {
      username: req.session.username,
      categories: categoriesForErrorPage,
      error: 'Failed to start quiz due to an internal error. Please try again.'
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
      profilePic: req.session.profilePic,
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

  // Save score to user's profile in MongoDB
  try {
    const db = getDB();
    const userId = req.session.userId; // Already a string from auth routes

      const scoreRecord = {
      quizId: new Date().getTime().toString(), // Simple unique ID for the quiz attempt
        score: quizSession.score,
        totalQuestions: quizSession.totalQuestions,
      categoryId: quizSession.categoryId,
      categoryName: quizSession.categoryName,
      difficulty: quizSession.difficulty,
      datePlayed: new Date()
    };

    const updateResult = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) }, // Convert string userId to ObjectId
      {
        $push: { quizHistory: scoreRecord },
        $inc: { totalAccumulatedScore: quizSession.score }
      }
    );

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
      // User found but not modified - could be an issue or just no change if score was 0 and no history added
      console.warn(`Quiz result for user ${userId} might not have been saved as expected.`);
    } else if (updateResult.matchedCount === 0) {
      console.error(`User with ID ${userId} not found. Could not save score.`);
      // Potentially redirect to logout or show a specific error
    }

    // Render results page
    res.render('quiz_results', {
      username: req.session.username,
      score: quizSession.score,
      totalQuestions: quizSession.totalQuestions,
      percentage: quizSession.totalQuestions > 0 ? Math.round((quizSession.score / quizSession.totalQuestions) * 100) : 0,
      answers: quizSession.answers
    });

    // Clear quiz session data after showing results
    delete req.session.quiz;
  } catch (error) {
    console.error('Error saving quiz results to MongoDB:', error);
    // It's important not to delete req.session.quiz here if saving failed,
    // so the user can potentially see their results again or retry.
    // However, for simplicity in this step, we'll still render an error page.
    res.status(500).render('error', {
      username: req.session.username,
      message: 'Failed to save your quiz results. Please try again or contact support.',
      error
    });
  }
});

// GET leaderboard page with filtering
router.get('/leaderboard', async (req, res) => {
  try {
    const db = getDB();
    const { category: filterCategoryId, difficulty: filterDifficulty } = req.query;

    const categories = await fetchCategories(); // For filter dropdown

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Unwind quizHistory
    pipeline.push({ $unwind: '$quizHistory' });

    // Stage 2: Match based on filters (if any)
    const matchStage = {};
    if (filterCategoryId) {
      matchStage['quizHistory.categoryId'] = filterCategoryId;
    }
    if (filterDifficulty) {
      matchStage['quizHistory.difficulty'] = filterDifficulty;
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Stage 3: Group by user and sum scores from matched history
    pipeline.push({
      $group: {
        _id: '$username', // Group by username
        filteredScore: { $sum: '$quizHistory.score' },
        // Keep original total accumulated score if needed for other display, or user's _id
        originalTotalScore: { $first: '$totalAccumulatedScore' },
        userId: { $first: '$_id'}
      }
    });

    // Stage 4: Sort by the filtered score
    pipeline.push({ $sort: { filteredScore: -1 } });

    // Stage 5: Limit to top 10
    pipeline.push({ $limit: 10 });

    // Stage 6: Project final fields (optional, cleans up output)
    pipeline.push({
        $project: {
            username: '$_id',
            totalAccumulatedScore: '$filteredScore', // Displaying the filtered score as the main score
            _id: 0 // Exclude the default _id from group stage if not needed
        }
    });

    const topUsers = await db.collection('users').aggregate(pipeline).toArray();

    // Current user rank calculation needs to be adapted if filters are active
    // For simplicity, current user rank will be based on the filtered leaderboard if they appear in it.
    // A more complex "your rank in this filtered view even if not top 10" is out of scope for this step.
    let currentUserData = null;
    if (req.session && req.session.userId) {
        const userInTop = topUsers.find(u => u.username === req.session.username); // Assuming username is unique and stored in session
        if (userInTop) {
            currentUserData = {
                rank: topUsers.indexOf(userInTop) + 1,
                score: userInTop.totalAccumulatedScore // This is their filtered score
            };
    }
    }

    const selectedCategoryName = filterCategoryId && categories.find(c => c.id.toString() === filterCategoryId.toString())?.name;


    res.render('leaderboard', {
      username: req.session.username,
      topUsers,
      categories: categories || [],
      selectedCategoryId: filterCategoryId,
      selectedCategoryName: selectedCategoryName || 'All',
      selectedDifficulty: filterDifficulty,
      currentUserRank: currentUserData ? currentUserData.rank : null,
      currentUserScore: currentUserData ? currentUserData.score : null,
      error: null
    });

  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    let categoriesForErrorPage = [];
    try {
        categoriesForErrorPage = await fetchCategories();
    } catch(catError){ console.error("Error fetching categories for error page", catError);}

    res.status(500).render('leaderboard', { // Render leaderboard with error
      username: req.session.username,
      topUsers: [],
      categories: categoriesForErrorPage,
      selectedCategoryId: req.query.category,
      selectedDifficulty: req.query.difficulty,
      currentUserRank: null,
      currentUserScore: null,
      error: 'Could not load the leaderboard. Please try again later.'
    });
  }
});

export default router;
