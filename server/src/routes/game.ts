// server/src/routes/game.ts
import express, { Request, Response } from 'express';
import { questionTree, TOTAL_QUESTIONS } from '../data/questionTree';
import { NLPMatcher } from '../services/nlpMatcher';
import { ElevenLabsService } from '../services/elevenLabsService';
import { GameSession, UserData, QuestionResponse } from '../types/game.types';

const router = express.Router();

// Services
const nlpMatcher = new NLPMatcher();
const elevenLabsService = new ElevenLabsService();

// In-memory session storage
const sessions = new Map<string, GameSession>();

// Helper: Format question response
function formatQuestionResponse(
  questionId: string,
  currentProgress: number
): QuestionResponse {
  const question = questionTree[questionId];
  
  // Get audio URL if TTS is enabled
  let audioUrl: string | undefined;
  if (question.tts?.enabled) {
    const audioPath = elevenLabsService.getAudioPath(questionId);
    if (audioPath) {
      audioUrl = `/api/game/audio/${questionId}`;
    }
  }
  
  return {
    question: {
      id: question.id,
      text: question.text,
      subtext: question.subtext,
      category: question.category,
      placeholder: question.placeholder,
      examples: question.examples.slice(0, 2),
      tooltip: question.tooltip,
      tts: question.tts?.enabled ? {
        enabled: true,
        audioUrl
      } : undefined
    },
    loadingTransition: question.loadingTransition,
    progress: {
      current: currentProgress,
      total: TOTAL_QUESTIONS
    }
  };
}

// Start game
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, ttsEnabled = true } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Initialize session
    const session: GameSession = {
      userId,
      currentQuestionId: 'start',
      answers: new Map(),
      userData: {},
      startedAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        ttsEnabled,
        autoPlayTTS: true
      }
    };

    sessions.set(userId, session);

    // Generate audio for first question if TTS enabled
    const firstQuestion = questionTree['start'];
    if (firstQuestion.tts?.enabled && ttsEnabled) {
      try {
        const textToSpeak = firstQuestion.tts.voicePrompt || firstQuestion.text;
        await elevenLabsService.generateSpeech(
          textToSpeak,
          'start',
          firstQuestion.tts.emphasis
        );
      } catch (error) {
        console.error('Failed to generate TTS for start:', error);
      }
    }

    const response = formatQuestionResponse('start', 1);
    res.json(response);
    
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Submit answer
router.post('/answer', async (req: Request, res: Response) => {
  try {
    const { userId, questionId, answer, ttsEnabled } = req.body;

    if (!userId || !questionId || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = sessions.get(userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (typeof ttsEnabled === 'boolean') {
      session.preferences.ttsEnabled = ttsEnabled;
    }

    // Save answer
    session.answers.set(questionId, answer);
    session.updatedAt = new Date();

    // Update userData
    updateUserData(session, questionId, answer);

    // Check if complete
    if (session.answers.size >= TOTAL_QUESTIONS || questionId === 'toyota_connection') {
      return res.json({
        complete: true,
        userData: session.userData,
        message: 'Journey complete!'
      });
    }

    // Get next question
    const currentQuestion = questionTree[questionId];
    let nextQuestionId: string;

    if (typeof currentQuestion.next === 'function') {
      nextQuestionId = currentQuestion.next(answer, session.userData);
    } else {
      nextQuestionId = currentQuestion.next;
    }

    session.currentQuestionId = nextQuestionId;

    // Generate audio for next question
    const nextQuestion = questionTree[nextQuestionId];
    if (nextQuestion.tts?.enabled && session.preferences.ttsEnabled) {
      try {
        const textToSpeak = nextQuestion.tts.voicePrompt || nextQuestion.text;
        await elevenLabsService.generateSpeech(
          textToSpeak,
          nextQuestionId,
          nextQuestion.tts.emphasis
        );
      } catch (error) {
        console.error(`Failed to generate TTS for ${nextQuestionId}:`, error);
      }
    }

    const response = formatQuestionResponse(
      nextQuestionId,
      session.answers.size + 1
    );

    res.json(response);
    
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({ error: 'Failed to process answer' });
  }
});

// Serve audio file
router.get('/audio/:questionId', (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const audioPath = elevenLabsService.getAudioPath(questionId);

    if (!audioPath || !require('fs').existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(audioPath);
    
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({ error: 'Failed to serve audio' });
  }
});

// Helper function
function updateUserData(
  session: GameSession,
  questionId: string,
  answer: string
): void {
  const userData = session.userData;

  switch (questionId) {
    case 'start':
      userData.buyerType = nlpMatcher.analyzeBuyerIntent(answer);
      break;

    case 'financial_comfort':
      const budget = nlpMatcher.extractBudgetAmount(answer);
      userData.budget = { monthly: budget };
      break;

    case 'down_payment_reality':
      const downPayment = nlpMatcher.extractBudgetAmount(answer);
      if (!userData.budget) userData.budget = {};
      userData.budget.downPayment = downPayment;
      
      const tradeInInfo = nlpMatcher.detectTradeInMention(answer);
      if (tradeInInfo.hasTradeIn) {
        userData.tradeIn = tradeInInfo;
      }
      break;

    case 'credit_conversation':
      const creditInfo = nlpMatcher.analyzeCreditResponse(answer);
      userData.creditScore = creditInfo.level;
      userData.creditConfidence = creditInfo.confidence;
      break;

    case 'lifestyle_mission':
      const lifestyleInfo = nlpMatcher.analyzeLifestyleIntent(answer);
      userData.lifestyle = lifestyleInfo;
      break;

    case 'priorities_tradeoffs':
      const priorityInfo = nlpMatcher.analyzePriorityIntent(answer);
      userData.priorities = priorityInfo;
      break;
  }
}

export default router;