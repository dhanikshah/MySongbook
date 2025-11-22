// Simple test to check if components can be imported and have valid structure
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing component structure...\n');

// Test 1: Check if LibraryPage has a return statement
const libraryPageContent = fs.readFileSync(path.join(__dirname, 'src/pages/LibraryPage.tsx'), 'utf8');
const hasReturn = libraryPageContent.includes('return (') || libraryPageContent.includes('return(');
console.log(hasReturn ? '✅ LibraryPage has return statement' : '❌ LibraryPage missing return statement');

// Test 2: Check if LibraryPage exports correctly
const hasExport = libraryPageContent.includes('export function LibraryPage') || libraryPageContent.includes('export const LibraryPage');
console.log(hasExport ? '✅ LibraryPage is exported' : '❌ LibraryPage not exported');

// Test 3: Check for any obvious syntax errors (unclosed brackets)
const openBraces = (libraryPageContent.match(/\{/g) || []).length;
const closeBraces = (libraryPageContent.match(/\}/g) || []).length;
const openParens = (libraryPageContent.match(/\(/g) || []).length;
const closeParens = (libraryPageContent.match(/\)/g) || []).length;
console.log(`📊 Braces: ${openBraces} open, ${closeBraces} close (${openBraces === closeBraces ? '✅' : '❌'})`);
console.log(`📊 Parens: ${openParens} open, ${closeParens} close (${openParens === closeParens ? '✅' : '❌'})`);

// Test 4: Check for any && conditionals that might cause issues
const andConditionals = (libraryPageContent.match(/\{[^}]*&&[^}]*\}/g) || []).length;
console.log(`📊 Found ${andConditionals} potential && conditionals in JSX`);

// Test 5: Check if AppWrapper exists
const appWrapperContent = fs.readFileSync(path.join(__dirname, 'src/components/AppWrapper.tsx'), 'utf8');
const appWrapperHasReturn = appWrapperContent.includes('return (') || appWrapperContent.includes('return(');
console.log(appWrapperHasReturn ? '✅ AppWrapper has return statement' : '❌ AppWrapper missing return statement');

// Test 6: Check if ThemeContext exists
const themeContextContent = fs.readFileSync(path.join(__dirname, 'app/context/ThemeContext.tsx'), 'utf8');
const hasThemeProvider = themeContextContent.includes('export function ThemeProvider');
console.log(hasThemeProvider ? '✅ ThemeProvider exists' : '❌ ThemeProvider missing');

console.log('\n✅ Structure tests complete!');

