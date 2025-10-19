// server/src/routes/game.routes.ts
import express, { Request, Response } from 'express';
import { questionTree, TOTAL_QUESTIONS } from '../data/questionTree';
import { NLPMatcher } from '../services/nlpMatcher';
// import { PaymentCalculator } from '../services/paymentCalculator';
// import { NessieService } from '../services/nessieAPISetup';
import { ElevenLabsService } from '../services/elevenLabsService';
import { GameSession, UserData, QuestionResponse } from '../types/game.types';
import path from 'path';

// Initialize services
const paymentCalculator = new PaymentCalculator();
const nessieService = new NessieService();


const router = express.Router();

// Services
const nlpMatcher = new NLPMatcher();
const elevenLabsService = new ElevenLabsService();

// In-memory session storage (use database in production)
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
      examples: question.examples.slice(0, 2), // Limit to 2
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

// ===== ROUTES =====

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
        // Continue without TTS
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

    // Update TTS preference if provided
    if (typeof ttsEnabled === 'boolean') {
      session.preferences.ttsEnabled = ttsEnabled;
    }

    // Save answer
    session.answers.set(questionId, answer);
    session.updatedAt = new Date();

    // Update userData based on question and answer
    await updateUserData(session, questionId, answer);

    // Check if complete
    if (session.answers.size >= TOTAL_QUESTIONS || questionId === 'toyota_connection') {
      return res.json({
        complete: true,
        userData: session.userData,
        message: 'Journey complete! Calculating matches...'
      });
    }

    // Determine next question
    const currentQuestion = questionTree[questionId];
    let nextQuestionId: string;

    if (typeof currentQuestion.next === 'function') {
      nextQuestionId = currentQuestion.next(answer, session.userData);
    } else {
      nextQuestionId = currentQuestion.next;
    }

    session.currentQuestionId = nextQuestionId;

    // Generate audio for next question if TTS enabled
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
        // Continue without TTS
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
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(audioPath);
    
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({ error: 'Failed to serve audio' });
  }
});

// Get cache statistics (for debugging)
router.get('/audio-stats', (req: Request, res: Response) => {
  const stats = elevenLabsService.getCacheStats();
  res.json(stats);
});

// Pre-generate all audio (optional - run once to cache all)
router.post('/pregenerate-audio', async (req: Request, res: Response) => {
  try {
    const questions = Object.values(questionTree).map(q => ({
      id: q.id,
      text: q.text,
      tts: q.tts
    }));

    await elevenLabsService.preGenerateAllAudio(questions);
    
    res.json({ 
      success: true, 
      message: 'Audio pre-generation complete',
      stats: elevenLabsService.getCacheStats()
    });
  } catch (error) {
    console.error('Pre-generation error:', error);
    res.status(500).json({ error: 'Failed to pre-generate audio' });
  }
});

router.post('/payment-simulation', async (req: Request, res: Response) => {
  try {
    const { userId, vehicleName, msrp, monthlyBudget } = req.body;

    const session = sessions.get(userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('Simulating payment for:', vehicleName);

    // Get user financial data
    const downPayment = session.userData.budget?.downPayment || 2000;
    const creditScore = session.userData.creditScore || 'good';
    const tradeInValue = session.userData.tradeIn?.estimatedValue || 0;

    // Calculate financing option
    const financeAPR = paymentCalculator.getAPRForCreditScore(creditScore, false);
    const financeOption = paymentCalculator.calculateFinancing(
      msrp,
      downPayment,
      tradeInValue,
      60, // 60 months
      financeAPR,
      creditScore
    );

    // Calculate leasing option
    const leaseAPR = paymentCalculator.getAPRForCreditScore(creditScore, true);
    const leaseOption = paymentCalculator.calculateLeasing(
      msrp,
      downPayment,
      36, // 36 months
      leaseAPR,
      0.50 // 50% residual value
    );

    // Calculate affordability scores
    financeOption.affordabilityScore = paymentCalculator.calculateAffordabilityScore(
      financeOption.totalMonthly,
      session.userData.budget?.monthly,
      monthlyBudget
    );

    leaseOption.affordabilityScore = paymentCalculator.calculateAffordabilityScore(
      leaseOption.totalMonthly,
      session.userData.budget?.monthly,
      monthlyBudget
    );

    // Generate financial tips
    const tips = paymentCalculator.generateFinancialTips(
      session.userData,
      financeOption,
      leaseOption
    );

    // Generate payment schedule for finance option
    const paymentSchedule = paymentCalculator.generatePaymentSchedule(
      financeOption.amountFinanced,
      financeAPR,
      60,
      new Date()
    );

    // Determine recommendation
    const recommendation = leaseOption.monthlyPayment < financeOption.monthlyPayment - 50 
      ? 'lease' 
      : 'finance';

    res.json({
      success: true,
      vehicleName,
      msrp,
      financeOption,
      leaseOption,
      recommendation,
      tips,
      paymentSchedule: paymentSchedule.slice(0, 12), // First year only
      userProfile: {
        monthlyBudget: session.userData.budget?.monthly,
        downPayment,
        creditScore,
        tradeInValue
      }
    });

  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
});

// ===== NEW ROUTE: Execute Nessie Transaction =====
router.post('/payment-execute', async (req: Request, res: Response) => {
  try {
    const { userId, vehicleName, downPayment, monthlyPayment } = req.body;

    console.log('Executing Nessie transaction...');

    // Get or create demo account
    const account = await nessieService.getOrCreateDemoAccount(userId);
    
    if (!account) {
      return res.status(500).json({ 
        error: 'Could not create demo account. Nessie API may be down.' 
      });
    }

    const initialBalance = account.balance;

    // Simulate down payment transaction
    const downPaymentResult = await nessieService.simulateDownPayment(
      account._id,
      downPayment,
      vehicleName
    );

    // Simulate first monthly payment
    const firstPaymentResult = await nessieService.simulateMonthlyPayment(
      account._id,
      monthlyPayment,
      1,
      vehicleName
    );

    res.json({
      success: true,
      message: 'Payment simulation executed!',
      accountId: account._id,
      initialBalance,
      newBalance: firstPaymentResult.newBalance,
      transactions: [
        {
          type: 'Down Payment',
          amount: downPayment,
          description: downPaymentResult.purchase.description
        },
        {
          type: 'First Monthly Payment',
          amount: monthlyPayment,
          description: firstPaymentResult.purchase.description
        }
      ],
      totalPaid: downPayment + monthlyPayment,
      remainingBalance: firstPaymentResult.newBalance
    });

  } catch (error) {
    console.error('Error executing payment:', error);
    res.status(500).json({ 
      error: 'Failed to execute payment simulation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Helper function to update user data
async function updateUserData(
  session: GameSession,
  questionId: string,
  answer: string
): Promise<void> {
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