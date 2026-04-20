const fs = require('fs').promises;
const path = require('path');

let currentLanguage = 'es';
let translations = {};

async function loadTranslations(lang) {
  try {
    const filePath = path.join(__dirname, 'locales', `${lang}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    translations = JSON.parse(data);
    currentLanguage = lang;
    console.log(`Translations loaded: ${lang}`);
  } catch (error) {
    console.error('Error loading translations:', error);
    // Fallback to Spanish if error
    if (lang !== 'es') {
      await loadTranslations('es');
    }
  }
}

function t(key) {
  return translations[key] || key;
}

function getLanguage() {
  return currentLanguage;
}

function setLanguage(lang) {
  currentLanguage = lang;
}

module.exports = {
  loadTranslations,
  t,
  getLanguage,
  setLanguage
};
