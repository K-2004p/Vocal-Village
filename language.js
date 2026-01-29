// Language management for Vocal Village

let currentLanguage = 'en';
let translations = {};

// Show language change alert
function showLanguageAlert(languageName) {
    const alerts = {
        'en': 'Language changed to English. Interface will update.',
        'hi': 'भाषा हिंदी में बदल गई। इंटरफ़ेस अपडेट हो जाएगा।',
        'ta': 'மொழி தமிழுக்கு மாற்றப்பட்டது. இடைமுகம் புதுப்பிக்கப்படும்.',
        'te': 'భాష తెలుగుకు మార్చబడింది. ఇంటర్ఫేస్ నవీకరించబడుతుంది.',
        'bn': 'ভাষা বাংলায় পরিবর্তন করা হয়েছে। ইন্টারফেস আপডেট হবে।'
    };
    
    // Show alert in the new language
    alert(alerts[languageName] || alerts['en']);
}

// Load translations
async function loadTranslations(lang) {
  try {
    const response = await fetch(`translations/${lang}.json`);
    translations[lang] = await response.json();
    return translations[lang];
  } catch (error) {
    console.error('Error loading translations:', error);
    // Fallback to English
    if (lang !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

// Translate a single element
function translateElement(element, langData) {
  const key = element.getAttribute('data-translate');
  const placeholder = element.getAttribute('data-placeholder-translate');
  
  if (key && langData[key]) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      if (placeholder) {
        element.placeholder = langData[key];
      }
    } else {
      element.textContent = langData[key];
    }
  }
  
  // Translate options in select elements
  if (element.tagName === 'SELECT') {
    Array.from(element.options).forEach(option => {
      const optionKey = option.getAttribute('data-translate');
      if (optionKey && langData[optionKey]) {
        option.textContent = langData[optionKey];
      }
    });
  }
}

// Apply translation to entire page
async function applyLanguage(lang) {
  currentLanguage = lang;
  
  // Show alert for language change
  const languageNames = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil', 
    'te': 'Telugu',
    'bn': 'Bengali'
  };
  showLanguageAlert(lang);
  
  // Load translations if not already loaded
  if (!translations[lang]) {
    await loadTranslations(lang);
  }
  
  const langData = translations[lang];
  if (!langData) return;
  
  // Update all translatable elements
  document.querySelectorAll('[data-translate]').forEach(element => {
    translateElement(element, langData);
  });
  
  // Update page title
  const titleElement = document.querySelector('title[data-translate]');
  if (titleElement && langData['app_name']) {
    document.title = langData['app_name'];
  }
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Save preference
  localStorage.setItem('vocalVillageLanguage', lang);
  
  // Update speech recognition language
  updateSpeechRecognitionLanguage(lang);
}

// Update speech recognition language
function updateSpeechRecognitionLanguage(lang) {
  const langMap = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'bn': 'bn-IN'
  };
  
  window.speechRecognitionLanguage = langMap[lang] || 'en-IN';
}

// Initialize language
async function initLanguage() {
  // Get saved language or default to English
  const savedLang = localStorage.getItem('vocalVillageLanguage') || 'en';
  
  // Set language select value
  const languageSelect = document.getElementById('languageSelect') || 
                        document.getElementById('voiceLanguageSelect');
  if (languageSelect) {
    languageSelect.value = savedLang;
  }
  
  // Apply language
  await applyLanguage(savedLang);
  
  // Add event listener for language change
  const selectors = ['languageSelect', 'voiceLanguageSelect'];
  selectors.forEach(selector => {
    const element = document.getElementById(selector);
    if (element) {
      element.addEventListener('change', async (e) => {
        await applyLanguage(e.target.value);
      });
    }
  });
}

// Call this when page loads
document.addEventListener('DOMContentLoaded', initLanguage);