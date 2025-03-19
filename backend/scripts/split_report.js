#!/usr/bin/env node

/**
 * Split report script
 * 
 * This script splits the output.md file into three separate files:
 * 1. code_review.md - Main code review content
 * 2. BIBLE.md - Code standards bible
 * 3. APP_DOCS.md - Application documentation
 * 
 * It then converts each markdown file to HTML using md2html.js
 * 
 * Usage: node split_report.js <input.md>
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: node split_report.js <input.md>');
  process.exit(0);
}

const inputFile = args[0];

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file '${inputFile}' does not exist`);
  process.exit(1);
}

// Read markdown content
let markdownContent;
try {
  markdownContent = fs.readFileSync(inputFile, 'utf8');
} catch (error) {
  console.error(`Error reading input file: ${error.message}`);
  process.exit(1);
}

// Define section markers
const bibleSectionMarker = '## Claude Bible';
const docsSectionMarker = '## Ideal Application Docs';

// Find section boundaries
const bibleIndex = markdownContent.indexOf(bibleSectionMarker);
const docsIndex = markdownContent.indexOf(docsSectionMarker);

if (bibleIndex === -1 || docsIndex === -1) {
  console.error('Error: Could not find all required sections in the input file.');
  console.error(`Bible section marker ${bibleIndex === -1 ? 'not found' : 'found at position ' + bibleIndex}`);
  console.error(`Docs section marker ${docsIndex === -1 ? 'not found' : 'found at position ' + docsIndex}`);
  process.exit(1);
}

// Extract sections
const codeReviewSection = markdownContent.substring(0, bibleIndex).trim();
const bibleSection = markdownContent.substring(bibleIndex, docsIndex).trim();
const docsSection = markdownContent.substring(docsIndex).trim();

// Output files
const codeReviewFile = 'code_review.md';
const bibleFile = 'BIBLE.md';
const docsFile = 'APP_DOCS.md';

// Write sections to files
try {
  fs.writeFileSync(codeReviewFile, codeReviewSection);
  console.log(`Created ${codeReviewFile}`);
  
  fs.writeFileSync(bibleFile, bibleSection);
  console.log(`Created ${bibleFile}`);
  
  fs.writeFileSync(docsFile, docsSection);
  console.log(`Created ${docsFile}`);
} catch (error) {
  console.error(`Error writing output files: ${error.message}`);
  process.exit(1);
}

// Convert markdown files to HTML
const files = [
  { md: codeReviewFile, html: codeReviewFile.replace('.md', '.html') },
  { md: bibleFile, html: bibleFile.replace('.md', '.html') },
  { md: docsFile, html: docsFile.replace('.md', '.html') }
];

console.log('\nConverting Markdown files to HTML...');

// Function to run md2html.js on each file
const convertFile = (file) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'md2html.js');
    const process = spawn('node', [scriptPath, file.md, file.html]);
    
    process.stdout.on('data', (data) => {
      console.log(`${data}`);
    });
    
    process.stderr.on('data', (data) => {
      console.error(`${data}`);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`md2html.js exited with code ${code}`));
      }
    });
  });
};

// Convert files sequentially
async function convertAllFiles() {
  for (const file of files) {
    try {
      await convertFile(file);
    } catch (error) {
      console.error(`Error converting ${file.md}: ${error.message}`);
    }
  }
  
  console.log('\nSummary:');
  console.log(`- Code review: ${codeReviewFile} → ${codeReviewFile.replace('.md', '.html')}`);
  console.log(`- Bible: ${bibleFile} → ${bibleFile.replace('.md', '.html')}`);
  console.log(`- Documentation: ${docsFile} → ${docsFile.replace('.md', '.html')}`);
  console.log('\nDone! You can now open the HTML files in your web browser.');
}

convertAllFiles(); 