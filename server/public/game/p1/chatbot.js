// ===== CONFIGURATION =====
const API_BASE_URL = 'http://localhost:5174/api';
const BACKEND_URL = 'http://localhost:5174';

// ===== STATE =====
let currentQuestion = null;
let userId = null;
let ttsEnabled = true;
let isPlaying = false;
let questionHistory = [];
let typingInterval = null;

// ===== DOM ELEMENTS =====
const elements = {
  ttsToggle: document.getElementById('ttsToggle'),
  loadingContainer: document.getElementById('loadingContainer'),
  loadingText: document.getElementById('loadingText'),
  questionContainer: document.getElementById('questionContainer'),
  questionCategory: document.getElementById('questionCategory'),
  questionText: document.getElementById('questionText'),
  questionSubtext: document.getElementById('questionSubtext'),
  replayAudio: document.getElementById('replayAudio'),
  replayText: document.getElementById('replayText'),
  answerInput: document.getElementById('answerInput'),
  examplesContainer: document.getElementById('examplesContainer'),
  examplesList: document.getElementById('examplesList'),
  tooltip: document.getElementById('tooltip'),
  tooltipText: document.getElementById('tooltipText'),
  submitButton: document.getElementById('submitButton'),
  backButton: document.getElementById('backButton'),
  errorMessage: document.getElementById('errorMessage'),
  errorText: document.getElementById('errorText'),
  ttsAudio: document.getElementById('ttsAudio'),
  chatRoot: document.getElementById('chatRoot'),
  questionBanner: document.querySelector('.question-banner')
};

// ===== INITIALIZATION =====
function init() {
  userId = getUserId();
  attachEventListeners();
  startGame();
}

// ===== EVENT LISTENERS =====
function attachEventListeners() {
  // Submit button
  if (elements.submitButton) {
    elements.submitButton.addEventListener('click', handleSubmit);
  }
  
  // Enter key to submit (Shift+Enter for new line)
  if (elements.answerInput) {
    elements.answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    });
  }

  // TTS toggle
  if (elements.ttsToggle) {
    elements.ttsToggle.addEventListener('click', toggleTTS);
  }

  // Replay audio
  if (elements.replayAudio) {
    elements.replayAudio.addEventListener('click', replayAudio);
  }

  // Back button
  if (elements.backButton) {
    elements.backButton.addEventListener('click', handleBack);
  }

  // Audio events
  if (elements.ttsAudio) {
    elements.ttsAudio.addEventListener('ended', () => {
      isPlaying = false;
      if (elements.replayText) {
        elements.replayText.textContent = 'Replay question';
      }
    });

    elements.ttsAudio.addEventListener('error', () => {
      console.error('Failed to load audio');
      isPlaying = false;
    });
  }
}

// ===== GAME FLOW =====
async function startGame() {
  try {
    console.log('🎮 Starting game with userId:', userId);
    
    const response = await fetch(`${API_BASE_URL}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ttsEnabled })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Game started successfully');
    displayQuestion(data);
    
  } catch (error) {
    console.error('Error starting game:', error);
    showError('Failed to start game. Please refresh the page.');
  }
}

async function handleSubmit() {
  const answer = elements.answerInput?.value.trim();
  
  if (!answer) {
    showError('Please enter an answer');
    return;
  }

  if (!currentQuestion) return;

  // Disable submit button
  if (elements.submitButton) {
    elements.submitButton.disabled = true;
  }
  
  // Add user message bubble
  if (window.addBubble) {
    window.addBubble(answer, 'right');
  }
  
  // Save to history
  questionHistory.push({
    question: currentQuestion,
    answer
  });

  try {
    // Show loading transition if available
    if (currentQuestion.loadingTransition) {
      showLoading(
        currentQuestion.loadingTransition.messages,
        currentQuestion.loadingTransition.duration
      );
    }

    const response = await fetch(`${API_BASE_URL}/game/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        questionId: currentQuestion.id,
        answer,
        ttsEnabled
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.complete) {
      // Journey complete - redirect to race results
      if (window.addBubble) {
        window.addBubble('Journey complete! Analyzing your matches...', 'left');
      }
      setTimeout(() => {
        window.location.href = '/analyst/index.html';
      }, currentQuestion.loadingTransition?.duration || 3000);
    } else {
      // Show next question after loading
      setTimeout(() => {
        hideLoading();
        displayQuestion(data);
      }, currentQuestion.loadingTransition?.duration || 2000);
    }
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    hideLoading();
    showError('Failed to submit answer. Please try again.');
    if (elements.submitButton) {
      elements.submitButton.disabled = false;
    }
  }
}

function displayQuestion(data) {
  const { question, progress } = data;
  currentQuestion = question;

  console.log('Displaying question:', question.id);

  // Update question banner
  if (elements.questionCategory) {
    elements.questionCategory.textContent = `Question ${progress.current} of ${progress.total}`;
  }

  if (elements.questionText) {
    elements.questionText.textContent = question.text;
  }

  if (elements.questionSubtext) {
    elements.questionSubtext.textContent = question.subtext || '';
    elements.questionSubtext.style.display = question.subtext ? 'block' : 'none';
  }

  // Add assistant message bubble (optional)
  if (window.addBubble && progress.current > 1) {
    window.addBubble(question.text, 'left');
  }
  
  // Reset answer input
  if (elements.answerInput) {
    elements.answerInput.value = '';
    elements.answerInput.placeholder = question.placeholder || 'Type your answer here...';
    elements.answerInput.focus();
  }

  // Update examples
  if (elements.examplesContainer && elements.examplesList) {
    if (question.examples && question.examples.length > 0) {
      elements.examplesContainer.style.display = 'block';
      elements.examplesList.innerHTML = question.examples
        .slice(0, 2)
        .map(ex => `<span>"${ex}"</span>`)
        .join(' · ');
    } else {
      elements.examplesContainer.style.display = 'none';
    }
  }

  // Update tooltip
  if (elements.tooltip && elements.tooltipText) {
    if (question.tooltip) {
      elements.tooltip.style.display = 'block';
      elements.tooltipText.textContent = question.tooltip;
    } else {
      elements.tooltip.style.display = 'none';
    }
  }

  // Show/hide replay button
  if (elements.replayAudio) {
    if (question.tts && question.tts.enabled && ttsEnabled) {
      elements.replayAudio.style.display = 'inline-block';
    } else {
      elements.replayAudio.style.display = 'none';
    }
  }

  // Enable submit button
  if (elements.submitButton) {
    elements.submitButton.disabled = false;
  }

  // Auto-play TTS
  if (question.tts && question.tts.enabled && question.tts.audioUrl && ttsEnabled) {
    playAudio(question.tts.audioUrl);
  }
}

// ===== LOADING WITH TYPING ANIMATION =====
function showLoading(messages, duration) {
  // Hide question banner, show loading
  if (elements.questionBanner) {
    elements.questionBanner.style.display = 'none';
  }
  if (elements.loadingContainer) {
    elements.loadingContainer.style.display = 'block';
  }
  
  // Pick a random message
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  // Start typing animation
  typeText(message, duration);
}

function hideLoading() {
  // Stop typing animation
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
  
  // Hide loading, show question banner
  if (elements.loadingContainer) {
    elements.loadingContainer.style.display = 'none';
  }
  if (elements.questionBanner) {
    elements.questionBanner.style.display = 'block';
  }
  if (elements.loadingText) {
    elements.loadingText.textContent = '';
  }
}

function typeText(text, duration) {
  if (!elements.loadingText) return;
  
  elements.loadingText.textContent = '';
  
  let currentIndex = 0;
  const typingSpeed = duration / text.length;
  
  // Clear any existing interval
  if (typingInterval) {
    clearInterval(typingInterval);
  }
  
  typingInterval = setInterval(() => {
    if (currentIndex < text.length) {
      elements.loadingText.textContent += text.charAt(currentIndex);
      currentIndex++;
    } else {
      // Once done, add blinking cursor effect
      clearInterval(typingInterval);
      
      let cursorVisible = true;
      typingInterval = setInterval(() => {
        if (cursorVisible) {
          elements.loadingText.textContent = text ;
        } else {
          elements.loadingText.textContent = text;
        }
        cursorVisible = !cursorVisible;
      }, 500);
    }
  }, typingSpeed);
}

// ===== TTS (Text-to-Speech) =====
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  
  if (elements.ttsToggle) {
    if (ttsEnabled) {
      elements.ttsToggle.textContent = ' Voice On';
      if (currentQuestion?.tts?.enabled && elements.replayAudio) {
        elements.replayAudio.style.display = 'inline-block';
      }
    } else {
      elements.ttsToggle.textContent = 'Voice Off';
      if (elements.replayAudio) {
        elements.replayAudio.style.display = 'none';
      }
      
      // Stop current audio
      if (isPlaying && elements.ttsAudio) {
        elements.ttsAudio.pause();
        isPlaying = false;
      }
    }
  }
}

function playAudio(audioUrl) {
  if (!ttsEnabled || !elements.ttsAudio) return;
  
  const fullUrl = `${BACKEND_URL}${audioUrl}`;
  elements.ttsAudio.src = fullUrl;
  
  elements.ttsAudio.play()
    .then(() => {
      isPlaying = true;
      if (elements.replayText) {
        elements.replayText.textContent = 'Playing...';
      }
    })
    .catch(error => {
      console.error('Failed to play audio:', error);
      isPlaying = false;
    });
}

function replayAudio() {
  if (!currentQuestion?.tts?.audioUrl || isPlaying) return;
  playAudio(currentQuestion.tts.audioUrl);
}

// ===== UTILITIES =====
function getUserId() {
  let id = localStorage.getItem('toyota_user_id');
  if (!id) {
    id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('toyota_user_id', id);
  }
  return id;
}

function showError(message) {
  if (elements.errorText) {
    elements.errorText.textContent = message;
  }
  if (elements.errorMessage) {
    elements.errorMessage.style.display = 'block';
    
    setTimeout(() => {
      elements.errorMessage.style.display = 'none';
    }, 5000);
  }
  
  // Also show in bubbles if available
  if (window.addBubble) {
    window.addBubble('X ' + message, 'left');
  }
}

function handleBack() {
  if (questionHistory.length > 0) {
    console.log('Previous questions:', questionHistory);
  }
}

// ===== START APP =====
// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function prioritizeToyotas(results) {
  const priority = ["camry", "corolla", "rav4"];
  const prioritySlots = new Array(priority.length).fill(null);
  const others = [];

  results.forEach((r) => {
    const name = (r.name || r.model || "").toLowerCase();
    const i = priority.findIndex(p => name.includes(p));
    if (i !== -1 && !prioritySlots[i]) prioritySlots[i] = r;
    else others.push(r);
  });

  const filledPriority = prioritySlots.filter(Boolean);
  const shuffledOthers = others.sort(() => Math.random() - 0.5);
  return [...filledPriority, ...shuffledOthers];
}