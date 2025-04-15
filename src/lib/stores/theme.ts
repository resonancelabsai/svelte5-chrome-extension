import { writable, get } from 'svelte/store';

type Theme = 'light' | 'dark' | 'system';

let theme = writable<Theme>('system');

/**
 * Get the current theme
 */
export function getTheme(): Theme {
  return get(theme);
}

/**
 * Set the theme
 * @param newTheme The theme to set
 */
export function setTheme(newTheme: Theme): void {
  theme.set(newTheme);
  
  // Save to localStorage
  try {
    localStorage.setItem('contextmaster-theme', newTheme);
  } catch (error) {
    console.error('Error saving theme to localStorage:', error);
  }
  
  // Apply the theme to the document
  applyTheme(newTheme);
  
  // Log theme change for debugging
  console.log('Theme changed to:', newTheme);
}

/**
 * Toggle between light and dark themes
 * If the current theme is system, it will switch to light or dark based on the system preference
 */
export function toggleTheme(): void {
  const currentTheme = getTheme();
  
  if (currentTheme === 'light') {
    setTheme('dark');
  } else if (currentTheme === 'dark') {
    setTheme('light');
  } else {
    // If system, check the current system preference and switch to the opposite
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'light' : 'dark');
  }
}

/**
 * Apply the theme to the document
 * @param themeName The theme to apply
 */
function applyTheme(themeName: Theme): void {
  const isDark = 
    themeName === 'dark' || 
    (themeName === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  document.documentElement.classList.toggle('dark', isDark);
  
  // Also set the data-theme attribute for components that use it
  document.documentElement.setAttribute('data-theme', themeName);
  
  // Update any elements with a data-theme attribute directly
  const themedElements = document.querySelectorAll('[data-theme]');
  themedElements.forEach(el => {
    el.setAttribute('data-theme', themeName);
  });
  
  console.log('Applied theme:', themeName, 'isDark:', isDark);
}

/**
 * Initialize the theme from localStorage or system preference
 */
export function initializeTheme(): void {
  let savedTheme: Theme = 'system';
  
  try {
    const storedTheme = localStorage.getItem('contextmaster-theme');
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')) {
      savedTheme = storedTheme as Theme;
    }
  } catch (error) {
    console.error('Error reading theme from localStorage:', error);
  }
  
  // Set the theme
  setTheme(savedTheme);
  
  // Listen for system theme changes if using 'system'
  if (savedTheme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial check
    applyTheme('system');
    
    // Watch for changes
    mediaQuery.addEventListener('change', () => {
      if (getTheme() === 'system') {
        applyTheme('system');
      }
    });
  }
}

export { theme };