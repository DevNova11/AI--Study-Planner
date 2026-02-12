// Dark Mode Toggle Functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const htmlElement = document.documentElement;

// Initialize dark mode from localStorage or system preference
const initializeDarkMode = () => {
  let isDarkMode = localStorage.getItem('darkMode');

  if (isDarkMode === null) {
    // Check system preference
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDarkMode = isDarkMode === 'true';
  }

  setDarkMode(isDarkMode);
};

// Set dark mode state
const setDarkMode = (isDark) => {
  if (isDark) {
    htmlElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
    updateIcons(true);
  } else {
    htmlElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
    updateIcons(false);
  }
};

// Update icon visibility
const updateIcons = (isDark) => {
  if (isDark) {
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
  } else {
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
  }
};

// Toggle dark mode
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const isDarkMode = htmlElement.classList.contains('dark-mode');
    setDarkMode(!isDarkMode);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDarkMode);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDarkMode);
} else {
  initializeDarkMode();
}
