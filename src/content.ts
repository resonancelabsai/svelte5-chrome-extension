/// <reference types="chrome" />

/**
 * ContextMaster Content Script
 * Detects and adds indicators to compatible input fields on web pages
 */

console.log('ContextMaster content script loaded');

// Types for input field detection
type InputField = HTMLTextAreaElement | HTMLInputElement;
type DetectedField = {
  element: InputField;
  indicator?: HTMLElement;
};

// Store for detected fields
const detectedFields: DetectedField[] = [];

/**
 * Check if an element is a compatible input field
 */
function isCompatibleField(element: Element): element is InputField {
  if (!(element instanceof HTMLElement)) return false;

  // Check for textarea elements
  if (element instanceof HTMLTextAreaElement) return true;

  // Check for text input elements
  if (element instanceof HTMLInputElement) {
    const validTypes = ['text', 'search', 'email', 'url', 'tel'];
    return validTypes.includes(element.type);
  }

  // TODO: Add support for rich text editors (contenteditable divs, etc.)
  // if (element.getAttribute('contenteditable') === 'true') return true;

  return false;
}

/**
 * Scan the page for compatible input fields
 */
function scanForInputFields() {
  console.log('Scanning for input fields...');
  
  // Find all potential input elements
  const textareas = Array.from(document.querySelectorAll('textarea'));
  const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"]'));
  // const contentEditables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
  
  // Combine all elements and filter for compatible fields
  const allElements = [...textareas, ...inputs];
  const compatibleFields = allElements.filter(isCompatibleField);
  
  console.log(`Found ${compatibleFields.length} compatible input fields`);
  
  // Process each field
  compatibleFields.forEach(addFieldToDetected);
}

/**
 * Add a field to the detected fields list
 */
function addFieldToDetected(field: InputField) {
  // Check if we've already detected this field
  if (detectedFields.some(f => f.element === field)) return;
  
  // Add to detected fields
  detectedFields.push({ element: field });
  
  // Add indicator to the field
  addIndicator(field);
}

/**
 * Create and add an indicator element next to an input field
 */
function addIndicator(field: InputField) {
  // Create indicator element
  const indicator = document.createElement('div');
  indicator.className = 'contextmaster-indicator';
  indicator.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.5V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.5"/><path d="M9 12h12"/><path d="m16 9 3 3-3 3"/></svg>';
  
  // Style the indicator
  Object.assign(indicator.style, {
    position: 'absolute',
    width: '20px',
    height: '20px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: '9999',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    color: '#6366f1',
    opacity: '0.8',
    transition: 'opacity 0.2s, transform 0.2s'
  });
  
  // Add hover effects
  indicator.addEventListener('mouseenter', () => {
    indicator.style.opacity = '1';
    indicator.style.transform = 'scale(1.05)';
  });
  
  indicator.addEventListener('mouseleave', () => {
    indicator.style.opacity = '0.8';
    indicator.style.transform = 'scale(1)';
  });
  
  // Position the indicator
  positionIndicator(field, indicator);
  
  // Add click event to show content popup
  indicator.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContentPopup(field);
  });
  
  // Add to the page
  document.body.appendChild(indicator);
  
  // Store reference to the indicator
  const fieldEntry = detectedFields.find(f => f.element === field);
  if (fieldEntry) {
    fieldEntry.indicator = indicator;
  }
}

/**
 * Position the indicator next to the input field
 */
function positionIndicator(field: InputField, indicator: HTMLElement) {
  const rect = field.getBoundingClientRect();
  
  // Position to the right of the field
  Object.assign(indicator.style, {
    top: `${window.scrollY + rect.top + rect.height/2 - 10}px`,
    left: `${window.scrollX + rect.right + 5}px`
  });
}

/**
 * Show the content popup when an indicator is clicked
 */
function showContentPopup(field: InputField) {
  console.log('Show content popup for field:', field);
  
  // TODO: Implement actual popup with content selection
  // For now, just send a message to the extension
  chrome.runtime.sendMessage({
    action: 'showContentPopup',
    fieldInfo: {
      type: field.tagName.toLowerCase(),
      id: field.id,
      name: field.name
    }
  });
}

/**
 * Update indicator positions when window is resized
 */
function updateIndicatorPositions() {
  detectedFields.forEach(field => {
    if (field.element && field.indicator) {
      positionIndicator(field.element, field.indicator);
    }
  });
}

/**
 * Initialize the content script
 */
function initialize() {
  // Scan for input fields with a slight delay to allow page to fully load
  setTimeout(scanForInputFields, 500);
  
  // Add listener for window resize
  window.addEventListener('resize', updateIndicatorPositions);
  
  // Re-scan when DOM changes (using MutationObserver)
  const observer = new MutationObserver((mutations) => {
    let shouldRescan = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldRescan = true;
        break;
      }
    }
    
    if (shouldRescan) {
      setTimeout(scanForInputFields, 100);
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Start the script
initialize(); 