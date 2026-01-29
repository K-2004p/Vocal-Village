// Speech to Text functionality for Vocal Village - UPDATED WITH AUDIO RECORDING

class SpeechToText {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.startTime = null;
    this.timerInterval = null;
    this.audioBlob = null;
    this.audioUrl = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    this.initSpeechRecognition();
  }
  
  initSpeechRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      this.showBrowserWarning();
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    
    // Set language based on current selection
    this.recognition.lang = window.speechRecognitionLanguage || 'en-IN';
    
    // Initialize audio recording
    this.initAudioRecording();
    
    // Event handlers for speech recognition
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStartCallback && this.onStartCallback();
      
      // Start audio recording
      this.startAudioRecording();
    };
    
    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + ' ';
          this.onResultCallback && this.onResultCallback(this.finalTranscript, confidence);
        } else {
          this.interimTranscript += transcript;
        }
      }
      
      // Show interim results
      this.onInterimCallback && this.onInterimCallback(this.interimTranscript);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.onErrorCallback && this.onErrorCallback(event.error);
      
      if (event.error === 'not-allowed') {
        this.showPermissionError();
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.stopAudioRecording();
      this.onEndCallback && this.onEndCallback();
    };
  }
  
  // Initialize audio recording
  async initAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.audioChunks = [];
        
        // Save to localStorage for playback
        this.saveAudioToLocalStorage();
      };
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.showPermissionError();
    }
  }
  
  startListening() {
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    
    try {
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.startTime = Date.now();
      this.startTimer();
      
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }
  
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.stopTimer();
    }
  }
  
  startAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.mediaRecorder.start();
    }
  }
  
  stopAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
  
  playRecording() {
    // Try to get audio from localStorage first
    const savedAudio = this.getAudioFromLocalStorage();
    
    if (savedAudio) {
      const audio = new Audio(savedAudio);
      audio.play().catch(e => {
        console.error('Error playing audio:', e);
        // Fallback to text-to-speech
        this.speakText();
      });
    } else if (this.audioUrl) {
      const audio = new Audio(this.audioUrl);
      audio.play().catch(e => {
        console.error('Error playing audio:', e);
        this.speakText();
      });
    } else {
      // No audio recording available, use text-to-speech
      this.speakText();
    }
  }
  
  speakText() {
    if ('speechSynthesis' in window && this.finalTranscript) {
      const utterance = new SpeechSynthesisUtterance(this.finalTranscript);
      utterance.lang = window.speechRecognitionLanguage || 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      alert('No audio recording available. Your text: ' + this.finalTranscript);
    }
  }
  
  saveAudioToLocalStorage() {
    if (this.audioBlob) {
      // Convert blob to base64 for localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        localStorage.setItem('lastAudioRecording', base64data);
      };
      reader.readAsDataURL(this.audioBlob);
    }
  }
  
  getAudioFromLocalStorage() {
    const audioData = localStorage.getItem('lastAudioRecording');
    return audioData || null;
  }
  
  startTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const seconds = Math.floor(elapsed / 1000);
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      timerElement.textContent = `${mins}:${secs}`;
    }, 1000);
  }
  
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  // Callback setters
  onStart(callback) {
    this.onStartCallback = callback;
  }
  
  onResult(callback) {
    this.onResultCallback = callback;
  }
  
  onInterim(callback) {
    this.onInterimCallback = callback;
  }
  
  onError(callback) {
    this.onErrorCallback = callback;
  }
  
  onEnd(callback) {
    this.onEndCallback = callback;
  }
  
  showBrowserWarning() {
    alert('Speech recognition is not supported in your browser. Please use Google Chrome for best experience.');
  }
  
  showPermissionError() {
    alert('Microphone permission is required for speech recognition. Please allow microphone access in your browser settings.');
  }
  
  setLanguage(language) {
    if (this.recognition) {
      const langMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'bn': 'bn-IN'
      };
      
      this.recognition.lang = langMap[language] || 'en-IN';
    }
  }
  
  destroy() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
}

// Initialize speech to text
let speechToText = null;

function initSpeechToText() {
  speechToText = new SpeechToText();
  
  // Set up callbacks
  speechToText.onStart(() => {
    updateUIForRecording(true);
  });
  
  speechToText.onResult((text, confidence) => {
    updateConvertedText(text, confidence);
  });
  
  speechToText.onInterim((text) => {
    // Show interim text in a different color
    const display = document.getElementById('convertedText');
    if (display) {
      display.innerHTML = `<span class="final-text">${speechToText.finalTranscript}</span>` +
                         `<span class="interim-text">${text}</span>`;
    }
  });
  
  speechToText.onEnd(() => {
    updateUIForRecording(false);
  });
  
  speechToText.onError((error) => {
    console.error('Speech recognition error:', error);
    updateUIForRecording(false);
  });
}

function updateUIForRecording(isRecording) {
  const recordBtn = document.getElementById('recordButton');
  const status = document.getElementById('recordingStatus');
  const stopBtn = document.getElementById('stopButton');
  const playBtn = document.getElementById('playButton');
  const redoBtn = document.getElementById('recordAgainButton');
  
  if (isRecording) {
    recordBtn.classList.add('recording');
    recordBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    
    if (status) {
      const span = status.querySelector('span');
      if (span) span.textContent = translations[currentLanguage]?.listening || 'Listening...';
    }
    
    if (stopBtn) stopBtn.disabled = false;
    if (playBtn) playBtn.disabled = true;
    if (redoBtn) redoBtn.disabled = true;
  } else {
    recordBtn.classList.remove('recording');
    recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    
    if (status) {
      const span = status.querySelector('span');
      if (span) span.textContent = translations[currentLanguage]?.ready || 'Ready';
    }
    
    if (stopBtn) stopBtn.disabled = true;
    if (playBtn) playBtn.disabled = false;
    if (redoBtn) redoBtn.disabled = false;
  }
}

function updateConvertedText(text, confidence) {
  const display = document.getElementById('convertedText');
  const confidenceScore = document.getElementById('confidenceScore');
  const confidenceFill = document.getElementById('confidenceFill');
  
  if (display) {
    display.textContent = text;
  }
  
  if (confidenceScore && confidence) {
    const percent = Math.round(confidence * 100);
    confidenceScore.textContent = `${percent}%`;
    
    if (confidenceFill) {
      confidenceFill.style.width = `${percent}%`;
      confidenceFill.style.backgroundColor = percent > 80 ? '#2a6e3f' : 
                                           percent > 60 ? '#e9b44c' : '#e74c3c';
    }
  }
}