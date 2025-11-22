// Simple test to verify components can be imported and basic structure
const React = require('react');

console.log('Testing component imports...');

try {
  // Test if we can require the components
  const { LibraryPage } = require('./src/pages/LibraryPage.tsx');
  console.log('✅ LibraryPage imported successfully');
} catch (e) {
  console.error('❌ LibraryPage import failed:', e.message);
}

try {
  const { AppWrapper } = require('./src/components/AppWrapper.tsx');
  console.log('✅ AppWrapper imported successfully');
} catch (e) {
  console.error('❌ AppWrapper import failed:', e.message);
}

try {
  const { ThemeProvider } = require('./app/context/ThemeContext.tsx');
  console.log('✅ ThemeProvider imported successfully');
} catch (e) {
  console.error('❌ ThemeProvider import failed:', e.message);
}

console.log('\nTest complete!');
