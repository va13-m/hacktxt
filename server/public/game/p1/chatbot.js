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
  questionHeader: document.getElementById('questionHeader'),
  questionCategory: document.getElementById('questionCategory'),
  questionText: document.getElementById('questionText'),
  questionSubtext: document.getElementById('questionSubtext'),
  replayAudio: document.getElementById('replayAudio'),
  replayText: document.getElementById('replayText'),
  answerSection: document.getElementById('answerSection'),
  answerInput: document.getElementById('answerInput'),
  examplesContainer: document.getElementById('examplesContainer'),
  examplesList: document.getElementById('examplesList'),
  tooltip: document.getElementById('tooltip'),
  tooltipText: document.getElementById('tooltipText'),
  submitButton: document.getElementById('submitButton'),
  backButton: document.getElementById('backButton'),
  errorMessage: document.getElementById('errorMessage'),
  errorText: document.getElementById('errorText'),
  ttsAudio: document.getElementById('ttsAudio')
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
  elements.submitButton.addEventListener('click', handleSubmit);
  
  // Enter key to submit (Shift+Enter for new line)
  elements.answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  });

  // TTS toggle
  elements.ttsToggle.addEventListener('click', toggleTTS);

  // Replay audio
  elements.replayAudio.addEventListener('click', replayAudio);

  // Back button
  elements.backButton.addEventListener('click', handleBack);

  // Audio ended event
  elements.ttsAudio.addEventListener('ended', () => {
    isPlaying = false;
    elements.replayText.textContent = 'Replay question';
  });

  // Audio error event
  elements.ttsAudio.addEventListener('error', () => {
    console.error('Failed to load audio');
    isPlaying = false;
  });
}

// ===== GAME FLOW =====

async function startGame() {
  try {
    console.log('Calling /api/game/start with userId:', userId); 
    
    const response = await fetch(`${API_BASE_URL}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ttsEnabled })
    });

    console.log('Response status:', response.status); 
    console.log('Response ok:', response.ok); 

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData); 
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success! Data:', data); 
    displayQuestion(data);
    
  } catch (error) {
    console.error('Error starting game:', error); // This is already there
    showError('Failed to start game. Please refresh the page.');
  }
}
async function handleSubmit() {
  const answer = elements.answerInput.value.trim();
  
  if (!answer) {
    showError('Please enter an answer');
    return;
  }

  if (!currentQuestion) return;

  // Disable submit button
  elements.submitButton.disabled = true;
  
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
      // Journey complete - show final message then redirect
      setTimeout(() => {
        window.location.href = '/race-results.html';
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
    elements.submitButton.disabled = false;
  }
}

function displayQuestion(data) {
  const { question, progress } = data;
  currentQuestion = question;

  // Update question content
  elements.questionText.textContent = question.text;
  elements.questionSubtext.textContent = question.subtext || '';
  
  // Reset answer input
  elements.answerInput.value = '';
  elements.answerInput.placeholder = question.placeholder;
  
  // Show/hide subtext
  if (question.subtext) {
    elements.questionSubtext.style.display = 'block';
  } else {
    elements.questionSubtext.style.display = 'none';
  }

  // Update examples (limit to 2)
  if (question.examples && question.examples.length > 0) {
    elements.examplesContainer.style.display = 'block';
    elements.examplesList.innerHTML = question.examples
      .slice(0, 2)
      .map(ex => `<span>"${ex}"</span>`)
      .join(' · ');
  } else {
    elements.examplesContainer.style.display = 'none';
  }

  // Update tooltip
  if (question.tooltip) {
    elements.tooltip.style.display = 'block';
    elements.tooltipText.textContent = question.tooltip;
  } else {
    elements.tooltip.style.display = 'none';
  }

  // Show/hide replay button
  if (question.tts && question.tts.enabled && ttsEnabled) {
    elements.replayAudio.style.display = 'inline-block';
  } else {
    elements.replayAudio.style.display = 'none';
  }

  // Enable submit button
  elements.submitButton.disabled = false;

  // Auto-play TTS
  if (question.tts && question.tts.enabled && question.tts.audioUrl && ttsEnabled) {
    playAudio(question.tts.audioUrl);
  }

  // Focus input
  elements.answerInput.focus();
}

// ===== LOADING WITH TYPING ANIMATION =====
function showLoading(messages, duration) {
  // Hide question, show loading
  elements.questionContainer.style.display = 'none';
  elements.loadingContainer.style.display = 'block';
  
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
  
  // Hide loading, show question
  elements.loadingContainer.style.display = 'none';
  elements.questionContainer.style.display = 'block';
  elements.loadingText.textContent = '';
}

function typeText(text, duration) {
  elements.loadingText.textContent = '';
  
  let currentIndex = 0;
  const typingSpeed = duration / text.length; // Distribute typing over duration
  
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
      
      // Optional: Add blinking cursor
      let cursorVisible = true;
      typingInterval = setInterval(() => {
        if (cursorVisible) {
          elements.loadingText.textContent = text + '▋';
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
  
  if (ttsEnabled) {
    elements.ttsToggle.textContent = 'Voice On';
    if (currentQuestion?.tts?.enabled) {
      elements.replayAudio.style.display = 'inline-block';
    }
  } else {
    elements.ttsToggle.textContent = 'Voice Off';
    elements.replayAudio.style.display = 'none';
    
    // Stop current audio
    if (isPlaying) {
      elements.ttsAudio.pause();
      isPlaying = false;
    }
  }
}

function playAudio(audioUrl) {
  if (!ttsEnabled) return;
  
  const fullUrl = `${BACKEND_URL}${audioUrl}`;
  elements.ttsAudio.src = fullUrl;
  
  elements.ttsAudio.play()
    .then(() => {
      isPlaying = true;
      elements.replayText.textContent = 'Playing...';
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
  elements.errorText.textContent = message;
  elements.errorMessage.style.display = 'block';
  
  setTimeout(() => {
    elements.errorMessage.style.display = 'none';
  }, 5000);
}

function handleBack() {
  // Navigate to previous question (if implemented)
  if (questionHistory.length > 0) {
    console.log('Previous questions:', questionHistory);
    // Could implement going back here
  }
}

// ===== START APP =====
document.addEventListener('DOMContentLoaded', init);
