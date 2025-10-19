// server/src/data/questionTree.ts
import { Question, UserData, QuestionCategory } from '../types/game.types';

export const TOTAL_QUESTIONS = 12;

//different arrays based on categories
//for the loading messages in between the questions
export const CELESTIAL_MESSAGES = {
  general: [
    "Reading your chart...",
    "Aligning the stars...",
    "Your future is looking bright...",
    "Consulting the cosmic map...",
    "The universe is listening...",
    "Charting your course...",
    "Calculating your destiny...",
    "The planets are aligning...",
    "Mapping your journey...",
    "Your path is becoming clear..."
  ],
  financial: [
    "Calculating your financial constellation...",
    "Aligning your budget with the stars...",
    "Charting your financial journey...",
    "The cosmos is crunching the numbers...",
    "Your financial future is aligning..."
  ],
  lifestyle: [
    "Exploring your lifestyle galaxy...",
    "Mapping your daily adventures...",
    "The stars reveal your path...",
    "Charting your cosmic course...",
    "Your journey is taking shape..."
  ],
  matching: [
    "The stars are aligning your perfect match...",
    "Cosmic forces at work...",
    "Your destiny is unfolding...",
    "Almost there, space explorer...",
    "The universe has spoken..."
  ]
};

// ✅ Helper function to get random messages
function getRandomMessages(category: keyof typeof CELESTIAL_MESSAGES, count: number = 3): string[] {
  const messages = CELESTIAL_MESSAGES[category];
  const shuffled = [...messages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const questionTree: Record<string, Question> = {
  
  // intro question to see where they are - NO LOADING (first question)
  start: {
    id: 'start',
    text: "Let's find your perfect Toyota. What brings you here today?",
    subtext: "This helps us understand where you are in your journey",
    category: 'intro',
    placeholder: "Type your answer here...",
    examples: [
      "I'm buying my first car",
      "Looking to upgrade"
    ],
    tts: {
      enabled: true,
      voicePrompt: "Let's find your perfect Toyota. What brings you here today?",
      emphasis: ["perfect Toyota"],
      pauseAfter: 500
    },
    next: (answer: string, userData: UserData) => {
      const lower = answer.toLowerCase();
      
      if (lower.includes('first') || lower.includes('never owned')) {
        userData.buyerType = 'first_time';
        return 'financial_comfort';
      }
      if (lower.includes('lease')) {
        userData.buyerType = 'lease_end';
        return 'lease_experience';
      }
      if (lower.includes('upgrade') || lower.includes('trade')) {
        userData.buyerType = 'upgrading';
        return 'current_situation';
      }
      
      userData.buyerType = 'exploring';
      return 'financial_comfort';
    }
  },

  //not their first car
  current_situation: {
    id: 'current_situation',
    text: "Tell me about your current ride. What's working and what's not?",
    subtext: "Understanding your experience helps us find your perfect upgrade",
    category: 'intro',
    placeholder: "e.g., '2015 Honda Civic, need more space'",
    examples: [
      "2018 sedan, too small now",
      "Old truck, expensive repairs"
    ],
    loadingTransition: {
      messages: getRandomMessages('general'),
      duration: 2000,
      animation: 'stars'
    },
    tts: {
      enabled: true,
      voicePrompt: "Tell me about your current ride. What's working for you, and what's not?",
      emphasis: ["current ride", "working"],
      pauseAfter: 500
    },
    next: 'financial_comfort'
  },

  //lease experience
  lease_experience: {
    id: 'lease_experience',
    text: "How's leasing been for you? Thinking of leasing again or ready to own?",
    subtext: "No judgment either way, both have great benefits!",
    category: 'intro',
    placeholder: "Share your thoughts...",
    examples: [
      "Loved the low payments",
      "Ready to own this time"
    ],
    loadingTransition: {
      messages: getRandomMessages('general'),
      duration: 2000,
      animation: 'constellation'
    },
    tts: {
      enabled: true,
      voicePrompt: "How's leasing been for you? Thinking of leasing again or ready to own?",
      emphasis: ["leasing", "own"],
      pauseAfter: 500
    },
    next: 'financial_comfort'
  },

  //budget related questions
  financial_comfort: {
    id: 'financial_comfort',
    text: "Let's talk budget in a way that feels real. What monthly payment feels comfortable for you?",
    subtext: "Think about your lifestyle--what works without stress?",
    category: 'financial',
    placeholder: "e.g., 'around $350 a month'",
    examples: [
      "Around $300 per month",
      "$400-500 range"
    ],
    tooltip: "Include insurance (~$100-150/mo) in your calculation",
    loadingTransition: {
      messages: getRandomMessages('financial'),
      duration: 2500,
      animation: 'orbit'
    },
    tts: {
      enabled: true,
      voicePrompt: "Let's talk budget in a way that feels real. What monthly payment feels comfortable for you?",
      emphasis: ["comfortable"],
      pauseAfter: 800
    },
    next: (answer: string, userData: UserData) => {
      const budgetMatch = answer.match(/\$?\s*(\d+)/);
      const budget = budgetMatch ? parseInt(budgetMatch[1]) : 0;
      
      if (!userData.budget) userData.budget = {};
      userData.budget.monthly = budget;
      
      if (budget < 300) {
        return 'financial_goals';
      }
      
      return 'down_payment_reality';
    }
  },

  //financial goals
  financial_goals: {
    id: 'financial_goals',
    text: "What matters most to you financially with this car?",
    subtext: "There's no wrong answer. We want to help you reach YOUR goals",
    category: 'financial',
    placeholder: "What's your priority?",
    examples: [
      "Keeping payments low",
      "Building my credit"
    ],
    loadingTransition: {
      messages: getRandomMessages('financial'),
      duration: 2000,
      animation: 'sparkles'
    },
    tts: {
      enabled: true,
      voicePrompt: "What matters most to you financially with this car? There's no wrong answer.",
      emphasis: ["matters most", "YOUR goals"],
      pauseAfter: 500
    },
    next: 'down_payment_reality'
  },

  //down payment
  down_payment_reality: {
    id: 'down_payment_reality',
    text: "How much can you comfortably put down without stressing your savings?",
    subtext: "Honest answer = better recommendations. Even $0 down is okay!",
    category: 'financial',
    placeholder: "e.g., '$2,000' or 'nothing right now'",
    examples: [
      "$0 - nothing down",
      "Around $2,000"
    ],
    tooltip: "Bigger down payment = lower monthly payment",
    loadingTransition: {
      messages: getRandomMessages('financial'),
      duration: 2000,
      animation: 'stars'
    },
    tts: {
      enabled: true,
      voicePrompt: "How much can you comfortably put down without stressing your savings?",
      emphasis: ["comfortably"],
      pauseAfter: 500
    },
    next: (answer: string, userData: UserData) => {
      const amountMatch = answer.match(/\$?\s*(\d+)/);
      const downPayment = amountMatch ? parseInt(amountMatch[1]) : 0;
      
      if (!userData.budget) userData.budget = {};
      userData.budget.downPayment = downPayment;
      
      if (answer.toLowerCase().includes('trade')) {
        return 'trade_in_context';
      }
      
      return 'credit_conversation';
    }
  },

  //trade in questions
  trade_in_context: {
    id: 'trade_in_context',
    text: "Tell me about your trade-in. What's the vehicle and roughly what's it worth?",
    subtext: "Just ballpark. We'll get you a real estimate later",
    category: 'financial',
    placeholder: "e.g., '2016 Civic, maybe $8,000'",
    examples: [
      "2017 Accord, around $12k",
      "2010 truck, maybe $6k"
    ],
    loadingTransition: {
      messages: getRandomMessages('financial'),
      duration: 2000,
      animation: 'constellation'
    },
    tts: {
      enabled: true,
      voicePrompt: "Tell me about your trade-in. What's the vehicle and roughly what's it worth?",
      emphasis: ["trade-in"],
      pauseAfter: 500
    },
    next: 'credit_conversation'
  },

  //credit score questions
  credit_conversation: {
    id: 'credit_conversation',
    text: "Let's talk credit. How would you describe your credit situation?",
    subtext: "We work with ALL credit levels. This helps us find the best path for YOU",
    category: 'financial',
    placeholder: "Be honest, we're here to help...",
    examples: [
      "Pretty good, around 700",
      "I'm rebuilding it"
    ],
    tooltip: "Don't know your score? No problem!",
    loadingTransition: { 
      messages: [
        "Creating a safe space...",
        "No judgment here...",
        "Your honesty helps us help you..."
      ],
      duration: 2500,
      animation: 'sparkles'
    },
    tts: {
      enabled: true,
      voicePrompt: "Let's talk credit. How would you describe your credit situation?",
      emphasis: ["honest"],
      pauseAfter: 800
    },
    next: (answer: string, userData: UserData) => {
      const lower = answer.toLowerCase();
      
      if (/excellent|great|800|780|750/.test(lower)) {
        userData.creditScore = 'excellent';
        userData.creditConfidence = 'high';
        return 'lifestyle_mission';
      }
      if (/good|decent|700|720/.test(lower)) {
        userData.creditScore = 'good';
        userData.creditConfidence = 'high';
        return 'lifestyle_mission';
      }
      if (/building|rebuilding|working on|bad|poor/.test(lower)) {
        userData.creditScore = 'building';
        userData.creditConfidence = 'low';
        return 'credit_reassurance';
      }
      if (/not sure|don't know|unsure/.test(lower)) {
        userData.creditScore = 'unsure';
        userData.creditConfidence = 'unsure';
        return 'credit_reassurance';
      }
      
      userData.creditScore = 'fair';
      userData.creditConfidence = 'medium';
      return 'lifestyle_mission';
    }
  },

  //credit reassurance
  credit_reassurance: {
    id: 'credit_reassurance',
    text: "That's totally okay! Toyota has programs for your situation. What's your main concern?",
    subtext: "Getting approved? Monthly payments? Building credit?",
    category: 'financial',
    placeholder: "What worries you most?",
    examples: [
      "Worried about approval",
      "Concerned about rates"
    ],
    loadingTransition: {
      messages: [
        "You're not alone...",
        "We've got your back...",
        "Toyota welcomes everyone..."
      ],
      duration: 2000,
      animation: 'sparkles'
    },
    tts: {
      enabled: true,
      voicePrompt: "That's totally okay! Toyota has programs for your situation. What's your main concern?",
      emphasis: ["totally okay", "your situation"],
      pauseAfter: 500
    },
    next: 'lifestyle_mission'
  },

  //lifestyle mission
  lifestyle_mission: {
    id: 'lifestyle_mission',
    text: "What's this car's mission in your life?",
    subtext: "Your real life matters. Let's find a car that fits YOUR world",
    category: 'lifestyle',
    placeholder: "How will you use it day-to-day?",
    examples: [
      "Daily commute to work",
      "Family trips on weekends"
    ],
    loadingTransition: {
      messages: getRandomMessages('lifestyle'),
      duration: 2500,
      animation: 'orbit'
    },
    tts: {
      enabled: true,
      voicePrompt: "What's this car's mission in your life?",
      emphasis: ["mission"],
      pauseAfter: 500
    },
    next: (answer: string, userData: UserData) => {
      const lower = answer.toLowerCase();
      
      const mentions = {
        family: /family|kids|children|carpool|school/.test(lower),
        work: /work|business|contractor|haul/.test(lower),
        commute: /commute|drive to work|daily/.test(lower),
        adventure: /adventure|camping|outdoors|road trip/.test(lower),
        city: /city|urban|parking/.test(lower)
      };
      
      if (mentions.family) return 'family_reality';
      if (mentions.work) return 'work_needs';
      if (mentions.commute) return 'commute_reality';
      
      return 'space_needs';
    }
  },

  //family reality
  family_reality: {
    id: 'family_reality',
    text: "How many people regularly ride with you, and what's the vibe?",
    subtext: "Car seats? Teenagers? Sports equipment? Give me the real picture",
    category: 'lifestyle',
    placeholder: "Describe your passengers...",
    examples: [
      "2 kids in car seats",
      "3 teenagers with gear"
    ],
    loadingTransition: {
      messages: getRandomMessages('lifestyle'),
      duration: 2000,
      animation: 'constellation'
    },
    tts: {
      enabled: true,
      voicePrompt: "How many people regularly ride with you, and what's the vibe?",
      emphasis: ["crew"],
      pauseAfter: 500
    },
    next: 'priorities_tradeoffs'
  },

  //work needs
  work_needs: {
    id: 'work_needs',
    text: "What do you need to haul for work?",
    subtext: "Tools, equipment, samples? Be specific",
    category: 'lifestyle',
    placeholder: "What goes in the vehicle?",
    examples: [
      "Ladders and tools",
      "Just laptop and briefcase"
    ],
    loadingTransition: {
      messages: getRandomMessages('lifestyle'),
      duration: 2000,
      animation: 'stars'
    },
    tts: {
      enabled: true,
      voicePrompt: "What do you need to haul for work?",
      emphasis: ["haul for work"],
      pauseAfter: 500
    },
    next: 'priorities_tradeoffs'
  },

  //commute reality
  commute_reality: {
    id: 'commute_reality',
    text: "Tell me about your commute. Distance? City or highway?",
    subtext: "Your daily drive matters - let's make it comfortable",
    category: 'lifestyle',
    placeholder: "Describe your typical drive...",
    examples: [
      "25 miles, mostly highway",
      "5 miles, city traffic"
    ],
    loadingTransition: {
      messages: getRandomMessages('lifestyle'),
      duration: 2000,
      animation: 'orbit'
    },
    tts: {
      enabled: true,
      voicePrompt: "Tell me about your commute. Distance? City or highway?",
      emphasis: ["commute"],
      pauseAfter: 500
    },
    next: 'priorities_tradeoffs'
  },

  //space needs
  space_needs: {
    id: 'space_needs',
    text: "How much space do you realistically need?",
    subtext: "People, gear, groceries - be honest!",
    category: 'lifestyle',
    placeholder: "What's your typical load?",
    examples: [
      "Just me and camping gear",
      "Weekly Costco runs"
    ],
    loadingTransition: {
      messages: getRandomMessages('lifestyle'),
      duration: 2000,
      animation: 'sparkles'
    },
    tts: {
      enabled: true,
      voicePrompt: "How much space do you realistically need? Think about people, gear, and groceries.",
      emphasis: ["realistically need"],
      pauseAfter: 500
    },
    next: 'priorities_tradeoffs'
  },

  //priorities
  priorities_tradeoffs: {
    id: 'priorities_tradeoffs',
    text: "What matters MOST to you? Lower payments, fuel savings, tech, or something else?",
    subtext: "You can't maximize everything, what's your #1 priority?",
    category: 'goals',
    placeholder: "What's non-negotiable?",
    examples: [
      "Payments under $400",
      "Best fuel economy"
    ],
    loadingTransition: {
      messages: [
        "Almost there, space explorer...",
        "The finish line is near...",
        "Your destiny awaits..."
      ],
      duration: 2500,
      animation: 'constellation'
    },
    tts: {
      enabled: true,
      voicePrompt: "What matters MOST to you? Lower payments, fuel savings, tech, or something else?",
      emphasis: ["matters most"],
      pauseAfter: 800
    },
    next: 'toyota_connection'
  },

  //toyota connection
  toyota_connection: {
    id: 'toyota_connection',
    text: "Last question! Any Toyota models on your radar?",
    subtext: "We'll match you either way - just curious!",
    category: 'goals',
    placeholder: "Any favorites in mind?",
    examples: [
      "Love the RAV4",
      "Totally open"
    ],
    loadingTransition: {
      messages: [
        "Final checkpoint...",
        "One last question...",
        "Your matches are almost ready..."
      ],
      duration: 2000,
      animation: 'sparkles'
    },
    tts: {
      enabled: true,
      voicePrompt: "Last question! Any Toyota models on your radar?",
      emphasis: ["last question"],
      pauseAfter: 500
    },
    next: 'complete'
  },

  //complete
  complete: {
    id: 'complete',
    text: "Amazing! The stars are aligning your perfect matches...",
    subtext: "",
    category: 'goals',
    placeholder: "",
    examples: [],
    loadingTransition: {
      messages: getRandomMessages('matching'),
      duration: 3000,
      animation: 'orbit'
    },
    tts: {
      enabled: true,
      voicePrompt: "The stars are aligning your perfect matches. Get ready for the race results!",
      emphasis: ["Amazing", "perfect matches"],
      pauseAfter: 1000
    },
    next: 'complete'
  }
};

export function getQuestion(id: string): Question | undefined {
  return questionTree[id];
}

export function getQuestionsByCategory(category: QuestionCategory): Question[] {
  return Object.values(questionTree).filter(q => q.category === category);
}