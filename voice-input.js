// Voice Input Page JavaScript
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize language
  await initLanguage();
  
  // Initialize speech to text
  initSpeechToText();
  
  // Get DOM elements
  const recordButton = document.getElementById('recordButton');
  const stopButton = document.getElementById('stopButton');
  const playButton = document.getElementById('playButton');
  const recordAgainButton = document.getElementById('recordAgainButton');
  const editTextBtn = document.getElementById('editTextBtn');
  const submitButton = document.getElementById('submitVoiceReport');
  const newReportBtn = document.getElementById('newReportBtn');
  const categoryItems = document.querySelectorAll('.category-item');
  const refreshVoiceLocation = document.getElementById('refreshVoiceLocation');
  const manualVoiceLocation = document.getElementById('manualVoiceLocation');
  const voiceLocation = document.getElementById('voiceLocation');
  const successModal = document.getElementById('successModal');
  
  let selectedCategory = '';
  let isEditing = false;
  
  // Initialize location
  updateVoiceLocation();
  
  // Category selection
  categoryItems.forEach(item => {
    item.addEventListener('click', function() {
      categoryItems.forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      selectedCategory = this.dataset.category;
    });
  });
  
  // Record button
  recordButton.addEventListener('mousedown', function() {
    if (speechToText) {
      speechToText.startListening();
    }
  });
  
  recordButton.addEventListener('mouseup', function() {
    if (speechToText) {
      speechToText.stopListening();
    }
  });
  
  recordButton.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (speechToText) {
      speechToText.startListening();
    }
  });
  
  recordButton.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (speechToText) {
      speechToText.stopListening();
    }
  });
  
  // Stop button
  stopButton.addEventListener('click', function() {
    if (speechToText) {
      speechToText.stopListening();
    }
  });
  
  // Play button
  playButton.addEventListener('click', function() {
  if (speechToText) {
    speechToText.playRecording();
  }
  });
  
  // Record again button
  recordAgainButton.addEventListener('click', function() {
    const textDisplay = document.getElementById('convertedText');
    if (textDisplay) {
      textDisplay.textContent = 'Your speech will be converted to text here...';
    }
    
    const confidenceScore = document.getElementById('confidenceScore');
    const confidenceFill = document.getElementById('confidenceFill');
    if (confidenceScore) confidenceScore.textContent = '0%';
    if (confidenceFill) confidenceFill.style.width = '0%';
    
    playButton.disabled = true;
    recordAgainButton.disabled = true;
  });
  
  // Edit text button
  editTextBtn.addEventListener('click', function() {
    const textDisplay = document.getElementById('convertedText');
    if (!textDisplay) return;
    
    isEditing = !isEditing;
    textDisplay.contentEditable = isEditing;
    textDisplay.style.backgroundColor = isEditing ? '#ffffe0' : 'white';
    
    if (isEditing) {
      editTextBtn.innerHTML = '<i class="fas fa-save"></i> Save Text';
      textDisplay.focus();
    } else {
      editTextBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Text';
      saveTextToLocalStorage();
    }
  });
  
  // Location buttons
  refreshVoiceLocation.addEventListener('click', updateVoiceLocation);
  
  manualVoiceLocation.addEventListener('click', function() {
    const manualLocation = prompt(translations[currentLanguage]?.manual_location || "Enter your location manually:", "");
    if (manualLocation && manualLocation.trim() !== "") {
      voiceLocation.textContent = manualLocation;
      localStorage.setItem('manualLocation', manualLocation);
    }
  });
  
  // Submit report
  submitButton.addEventListener('click', async function() {
    if (!selectedCategory) {
      alert(translations[currentLanguage]?.select_type || 'Please select problem type');
      return;
    }
    
    const textDisplay = document.getElementById('convertedText');
    const problemText = textDisplay ? textDisplay.textContent : '';
    
    if (problemText.length < 10) {
      alert(translations[currentLanguage]?.speak_now || 'Please record your problem first');
      return;
    }
    
    // Show loading
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitButton.disabled = true;
    
    try {
      // Prepare report data
      const reportData = {
        problem_type: selectedCategory,
        description: problemText,
        voice_text: problemText,
        location: voiceLocation.textContent,
        language: currentLanguage,
        timestamp: new Date().toISOString()
      };
      
      // In production, send to backend API
      // const response = await fetch('http://localhost:5000/api/report/submit', {
      //   method: 'POST',
      //   headers: {'Content-Type': 'application/json'},
      //   body: JSON.stringify(reportData)
      // });
      
      // For demo, simulate API call
      setTimeout(() => {
        const refNum = 'VV-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('reportReference').textContent = refNum;
        successModal.style.display = 'flex';
        
        // Reset button
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> ' + 
                                (translations[currentLanguage]?.submit || 'Submit Report');
        submitButton.disabled = false;
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
      submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> ' + 
                              (translations[currentLanguage]?.submit || 'Submit Report');
      submitButton.disabled = false;
    }
  });
  
  // New report button
  newReportBtn.addEventListener('click', function() {
    successModal.style.display = 'none';
    
    // Reset form
    categoryItems.forEach(i => i.classList.remove('selected'));
    selectedCategory = '';
    
    const textDisplay = document.getElementById('convertedText');
    if (textDisplay) {
      textDisplay.textContent = 'Your speech will be converted to text here...';
      textDisplay.contentEditable = false;
      textDisplay.style.backgroundColor = 'white';
    }
    
    editTextBtn.innerHTML = '<i class="fas fa-edit"></i> ' + 
                           (translations[currentLanguage]?.edit_text || 'Edit Text');
    isEditing = false;
    
    playButton.disabled = true;
    recordAgainButton.disabled = true;
    
    const confidenceScore = document.getElementById('confidenceScore');
    const confidenceFill = document.getElementById('confidenceFill');
    if (confidenceScore) confidenceScore.textContent = '0%';
    if (confidenceFill) confidenceFill.style.width = '0%';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === successModal) {
      successModal.style.display = 'none';
    }
  });
});

// Update voice page location
async function updateVoiceLocation() {
  const voiceLocation = document.getElementById('voiceLocation');
  if (!voiceLocation) return;
  
  voiceLocation.textContent = translations[currentLanguage]?.location_loading || 'Loading...';
  
  try {
    const location = await getCurrentLocation();
    voiceLocation.textContent = location;
  } catch (error) {
    console.error('Error getting location:', error);
    voiceLocation.textContent = 'Location not available';
    
    // Check for manual location
    const manualLocation = localStorage.getItem('manualLocation');
    if (manualLocation) {
      voiceLocation.textContent = manualLocation;
    }
  }
}

// Save text to localStorage
function saveTextToLocalStorage() {
  const textDisplay = document.getElementById('convertedText');
  if (textDisplay) {
    localStorage.setItem('lastReportText', textDisplay.textContent);
  }
}

// Load text from localStorage
function loadTextFromLocalStorage() {
  const savedText = localStorage.getItem('lastReportText');
  if (savedText) {
    const textDisplay = document.getElementById('convertedText');
    if (textDisplay) {
      textDisplay.textContent = savedText;
    }
  }
}