// Main JavaScript for Vocal Village

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize language
  await initLanguage();
  
  // Initialize location
  await updateLocation();
  
  // Get DOM elements
  const textInputBtn = document.getElementById('textInputBtn');
  const textInputModal = document.getElementById('textInputModal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const modalLocation = document.getElementById('modalLocation');
  const manualLocationBtn = document.getElementById('manualLocationBtn');
  const submitTextReport = document.getElementById('submitTextReport');
  const problemText = document.getElementById('problemText');
  const problemType = document.getElementById('problemType');
  const voiceToTextBtn = document.getElementById('voiceToTextBtn');
  const refreshLocationBtn = document.getElementById('refreshLocation');
  const digilockerLogin = document.getElementById('digilockerLogin');
  const manualAadhaarBtn = document.getElementById('manualAadhaarBtn');
  const aadhaarModal = document.getElementById('aadhaarModal');
  const verifyAadhaar = document.getElementById('verifyAadhaar');
  const cancelAadhaar = document.getElementById('cancelAadhaar');
  const aadhaarNumber = document.getElementById('aadhaarNumber');
  
  // Text input modal
  textInputBtn.addEventListener('click', function() {
    modalLocation.textContent = document.getElementById('currentLocation').textContent;
    textInputModal.style.display = 'flex';
  });
  
  // Close modals
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
  
  // Manual location
  manualLocationBtn.addEventListener('click', function() {
    const promptText = translations[currentLanguage]?.manual_location || 'Enter your location manually:';
    const manualLocation = prompt(promptText, "");
    if (manualLocation && manualLocation.trim() !== "") {
      modalLocation.textContent = manualLocation;
      localStorage.setItem('manualLocation', manualLocation);
    }
  });
  
  // Refresh location
  refreshLocationBtn.addEventListener('click', updateLocation);
  
  // Voice to text in text modal
  voiceToTextBtn.addEventListener('click', function() {
    if (!speechToText) {
      initSpeechToText();
    }
    
    // Start listening for text input
    speechToText.startListening();
    
    // Update callback for text input
    speechToText.onResult((text) => {
      problemText.value = text;
    });
    
    // Update UI
    voiceToTextBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Listening...';
    voiceToTextBtn.disabled = true;
    
    // Stop after 30 seconds
    setTimeout(() => {
      if (speechToText && speechToText.isListening) {
        speechToText.stopListening();
        voiceToTextBtn.innerHTML = '<i class="fas fa-microphone"></i> ' + 
                                  (translations[currentLanguage]?.speak_now || 'Speak Now');
        voiceToTextBtn.disabled = false;
      }
    }, 30000);
  });
  
  // Submit text report
  submitTextReport.addEventListener('click', async function() {
    const type = problemType.value;
    const text = problemText.value.trim();
    const location = modalLocation.textContent;
    
    if (!type) {
      alert(translations[currentLanguage]?.select_type || 'Please select problem type');
      return;
    }
    
    if (text.length < 10) {
      alert(translations[currentLanguage]?.speak_now || 'Please describe your problem in detail');
      return;
    }
    
    // Show loading
    submitTextReport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
                                (translations[currentLanguage]?.submit || 'Submitting...');
    submitTextReport.disabled = true;
    
    try {
      // In production, send to backend
      // const response = await fetch('http://localhost:5000/api/report/submit', {
      //   method: 'POST',
      //   headers: {'Content-Type': 'application/json'},
      //   body: JSON.stringify({
      //     problem_type: type,
      //     description: text,
      //     location: location,
      //     language: currentLanguage
      //   })
      // });
      
      setTimeout(() => {
        const refNum = 'VV-' + Math.floor(1000 + Math.random() * 9000);
        const successMsg = translations[currentLanguage]?.success || 'Report Submitted!';
        const refMsg = translations[currentLanguage]?.reference || 'Reference Number';
        
        alert(`${successMsg}\n${refMsg}: ${refNum}\n${translations[currentLanguage]?.next_steps || 'Our team will take action soon.'}`);
        
        // Reset form
        problemType.value = "";
        problemText.value = "";
        submitTextReport.innerHTML = '<i class="fas fa-paper-plane"></i> ' + 
                                    (translations[currentLanguage]?.submit || 'Submit Report');
        submitTextReport.disabled = false;
        textInputModal.style.display = 'none';
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report');
      submitTextReport.innerHTML = '<i class="fas fa-paper-plane"></i> ' + 
                                  (translations[currentLanguage]?.submit || 'Submit Report');
      submitTextReport.disabled = false;
    }
  });
  
  // DigiLocker login
  digilockerLogin.addEventListener('click', function() {
    // Simulate DigiLocker OAuth flow
    alert(translations[currentLanguage]?.digilocker_login || 'Redirecting to DigiLocker...');
    
    // In production: window.location.href = 'https://digilocker.gov.in/oauth2/authorize?...';
    
    // For demo, simulate successful login
    setTimeout(() => {
      alert('Login successful via DigiLocker!');
      updateLoginStatus(true);
    }, 1000);
  });
  
  // Manual Aadhaar login
  manualAadhaarBtn.addEventListener('click', function() {
    aadhaarModal.style.display = 'flex';
  });
  
  // Verify Aadhaar
  verifyAadhaar.addEventListener('click', async function() {
    const aadhaar = aadhaarNumber.value.replace(/\s/g, '');
    
    if (!/^\d{12}$/.test(aadhaar)) {
      alert(translations[currentLanguage]?.aadhaar_input || 'Please enter valid 12-digit Aadhaar number');
      return;
    }
    
    verifyAadhaar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
                             (translations[currentLanguage]?.verify || 'Verifying...');
    verifyAadhaar.disabled = true;
    
    try {
      // In production, call backend API
      // const response = await fetch('http://localhost:5000/api/login/manual', {
      //   method: 'POST',
      //   headers: {'Content-Type': 'application/json'},
      //   body: JSON.stringify({ aadhaar_number: aadhaar })
      // });
      
      setTimeout(() => {
        alert('Aadhaar verified successfully!');
        aadhaarModal.style.display = 'none';
        verifyAadhaar.innerHTML = '<i class="fas fa-check"></i> ' + 
                                 (translations[currentLanguage]?.verify || 'Verify');
        verifyAadhaar.disabled = false;
        updateLoginStatus(true);
      }, 1500);
      
    } catch (error) {
      console.error('Error verifying Aadhaar:', error);
      alert('Error verifying Aadhaar');
      verifyAadhaar.innerHTML = '<i class="fas fa-check"></i> ' + 
                               (translations[currentLanguage]?.verify || 'Verify');
      verifyAadhaar.disabled = false;
    }
  });
  
  // Cancel Aadhaar
  cancelAadhaar.addEventListener('click', function() {
    aadhaarModal.style.display = 'none';
    aadhaarNumber.value = '';
  });
  
  // Aadhaar input formatting
  aadhaarNumber.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Format as XXXX XXXX XXXX
    if (value.length > 8) {
      value = value.substring(0, 4) + ' ' + value.substring(4, 8) + ' ' + value.substring(8, 12);
    } else if (value.length > 4) {
      value = value.substring(0, 4) + ' ' + value.substring(4);
    }
    
    e.target.value = value;
  });
});

// Update location display
async function updateLocation() {
  const locationElement = document.getElementById('currentLocation');
  if (!locationElement) return;
  
  locationElement.textContent = translations[currentLanguage]?.location_loading || 'Loading...';
  
  try {
    const location = await getCurrentLocation();
    locationElement.textContent = location;
  } catch (error) {
    console.error('Error getting location:', error);
    locationElement.textContent = 'Location not available';
    
    // Check for manual location
    const manualLocation = localStorage.getItem('manualLocation');
    if (manualLocation) {
      locationElement.textContent = manualLocation;
    }
  }
}

// Update login status
function updateLoginStatus(isLoggedIn) {
  const loginSection = document.querySelector('.login-section');
  if (!loginSection) return;
  
  if (isLoggedIn) {
    loginSection.innerHTML = `
      <p><i class="fas fa-check-circle" style="color: #2a6e3f;"></i> 
      ${translations[currentLanguage]?.login_prompt || 'Logged in successfully'}</p>
      <button id="logoutBtn" class="logout-btn">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    `;
    
    // Add logout functionality
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
      updateLoginStatus(false);
    });
  }
}