// server/src/services/nlpMatcher.ts

export class NLPMatcher {
  
  analyzeBuyerIntent(answer: string): string {
    const lower = answer.toLowerCase();
    
    if (/first|never|new to|first car|never owned/i.test(lower)) {
      return 'first_time';
    }
    if (/lease|leasing/i.test(lower)) {
      return 'lease_end';
    }
    if (/upgrade|replace|trade|selling/i.test(lower)) {
      return 'upgrading';
    }
    
    return 'exploring';
  }

  extractBudgetAmount(answer: string): number {
    const patterns = [
      /\$?\s*(\d+)\s*-\s*\$?\s*(\d+)/, // Range: $300-400
      /around\s+\$?\s*(\d+)/i,          // around $350
      /maybe\s+\$?\s*(\d+)/i,           // maybe $350
      /\$?\s*(\d+)/                      // $350 or 350
    ];
    
    for (const pattern of patterns) {
      const match = answer.match(pattern);
      if (match) {
        if (match[2]) {
          return (parseInt(match[1]) + parseInt(match[2])) / 2;
        }
        return parseInt(match[1]);
      }
    }
    
    return 0;
  }

  analyzeCreditResponse(answer: string): {
    level: string;
    confidence: 'high' | 'medium' | 'low' | 'unsure';
    needsReassurance: boolean;
  } {
    const lower = answer.toLowerCase();
    
    if (/excellent|great|800|780|750/i.test(lower)) {
      return { level: 'excellent', confidence: 'high', needsReassurance: false };
    }
    if (/good|decent|700|720/i.test(lower)) {
      return { level: 'good', confidence: 'high', needsReassurance: false };
    }
    if (/fair|average|650|660/i.test(lower)) {
      return { level: 'fair', confidence: 'medium', needsReassurance: false };
    }
    if (/building|rebuilding|working on|bad|poor/i.test(lower)) {
      return { level: 'building', confidence: 'low', needsReassurance: true };
    }
    if (/don't know|not sure|unsure/i.test(lower)) {
      return { level: 'unsure', confidence: 'unsure', needsReassurance: true };
    }
    
    return { level: 'fair', confidence: 'medium', needsReassurance: false };
  }

  analyzeLifestyleIntent(answer: string) {
    const lower = answer.toLowerCase();
    
    const mentions = {
      family: /family|kids|children|carpool|school/.test(lower),
      kids: /kids|children|toddler|baby|car seat/.test(lower),
      work: /work|job|office|business|contractor/.test(lower),
      business: /business|contractor|self-employed/.test(lower),
      commute: /commute|drive to work|daily/.test(lower),
      adventure: /adventure|camping|outdoors|road trip/.test(lower),
      city: /city|urban|downtown|parking/.test(lower)
    };
    
    let primaryUse = 'general';
    if (mentions.commute) primaryUse = 'commute';
    if (mentions.family) primaryUse = 'family';
    if (mentions.work || mentions.business) primaryUse = 'work';
    if (mentions.adventure) primaryUse = 'adventure';
    
    const keywords = answer.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    return { primaryUse, mentions, keywords };
  }

analyzePriorityIntent(answer: string) {
  const lower = answer.toLowerCase();
  
  const priorities = {
    payment: /payment|monthly|afford|budget/i,
    fuel: /fuel|gas|mpg|economy|efficient/i,
    safety: /safety|safe|protect/i,
    tech: /tech|technology|carplay|android/i,
    reliability: /reliable|dependable|last|durable/i,
    space: /space|room|cargo|seats/i,
    style: /look|style|cool|fun|sporty/i
  };
  
  // ✅ FIX: Filter correctly
  const matched = Object.entries(priorities)
    .filter(([key, regex]) => regex.test(lower))  // ✅ regex is already a RegExp
    .map(([key]) => key);
  
  let intensity: 'must_have' | 'important' | 'nice_to_have' = 'important';
  if (/must|have to|need to|#1|most important/i.test(lower)) {
    intensity = 'must_have';
  } else if (/would like|prefer|hope/i.test(lower)) {
    intensity = 'nice_to_have';
  }
  
  return {
    topPriority: matched[0] || 'reliability',
    secondaryPriorities: matched.slice(1),
    intensity
  };
}
}

export default NLPMatcher;