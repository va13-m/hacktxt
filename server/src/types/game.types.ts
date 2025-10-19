
//different question categories to help curate the best matches for the user
//important part to note as part of user experience and best analysis 
//and to include in the presentation possibly
export type QuestionCategory = 'intro' | 'financial' | 'lifestyle' | 'features' | 'goals';

//setting up the question
export interface Question {
  id: string;
  text: string;
  subtext?: string; //explanation of why we ask
  category: QuestionCategory;
  placeholder: string;
  examples: string[]; //example answers for users
  tooltip?: string; //to help the user out on the context of the question
  //for text to speech, adjust if needed for electron labs
  tts?: {
    enabled: boolean;
    voicePrompt?: string;
    emphasis?: string[];
    pauseAfter?: number;
  }
  //transition in between the questions
  loadingTransition?: {
    messages: string[];
    duration: number;
    animation?: 'stars' | 'constellation' | 'orbit' | 'sparkles';
  };
  next: string | ((answer: string, userData: UserData) => string); //dynamic routing
}

export interface UserData {
  buyerType?: string;
  budget?: {
    monthly?: number;
    downPayment?: number;
    total?: number;
  };
  creditScore?: string;
  creditConfidence?: 'high' | 'medium' | 'low' | 'unsure';
  employment?: string;
  tradeIn?: {
    hasTradeIn: boolean;
    vehicle?: string;
    estimatedValue?: number;
  };
  lifestyle?: {
    primaryUse: string;
    mentions: {
      family: boolean;
      kids: boolean;
      work: boolean;
      business: boolean;
      commute: boolean;
      adventure: boolean;
      city: boolean;
    };
    keywords: string[];
  };
  priorities?: {
    topPriority: string;
    secondaryPriorities: string[];
    //rating on the user's priorities
    intensity: 'must_have' | 'important' | 'nice_to_have';
  };
  toyota?: {
    familiarity?: string;
    models?: string[];
  };
}

export interface GameSession {
  userId: string;
  currentQuestionId: string;
  answers: Map<string, string>; //hash map data structure for user's answers
  userData: UserData; 
  startedAt: Date;
  updatedAt: Date;
  preferences: {
    ttsEnabled: boolean;
    autoPlayTTS: boolean;
  };
}

export interface QuestionResponse {
  question: {
    id: string;
    text: string;
    subtext?: string;
    category: QuestionCategory;
    placeholder: string;
    examples: string[];
    tooltip?: string;
    tts?: {
        enabled: boolean;
        audioUrl?: string; //if it is pre-generated audio, need to look into eleven labs
    };
  };
  loadingTransition?: {
    messages: string[];
    duration: number;
    animation?: string;
  };
  progress: {
    current: number;
    total: number;
  };
}

export interface IntentAnalysis {
  category: string;
  confidence: number;
  extractedData: any;
  keywords: string[];
}