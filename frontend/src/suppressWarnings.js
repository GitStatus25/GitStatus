/**
 * This file suppresses React DOM nesting warnings in development mode
 * It should be imported at the entry point of the application
 */

// Original console.error
const originalConsoleError = console.error;

// Filter out validateDOMNesting warnings
console.error = function filterWarnings(...args) {
  const suppressedWarnings = [
    'Warning: validateDOMNesting(...):',
  ];
  
  // Check if this is a warning we want to suppress
  if (args.length > 0 && typeof args[0] === 'string') {
    for (const warning of suppressedWarnings) {
      if (args[0].includes(warning)) {
        return; // Don't log this warning
      }
    }
  }
  
  // Call original console.error for other warnings/errors
  originalConsoleError.apply(console, args);
};

export default function setupWarningSuppressions() {
  // This function exists just to make the import look intentional
  return null;
} 