#!/usr/bin/env node

/**
 * Markdown to HTML converter script
 * 
 * Usage: node md2html.js <input.md> [output.html]
 * 
 * If output file is not specified, it will use the input filename with .html extension
 */

const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Configure marked options
marked.setOptions({
  gfm: true,            // GitHub Flavored Markdown
  breaks: true,         // Convert line breaks to <br>
  headerIds: true,      // Add id attributes to headers
  mangle: false         // Don't escape HTML
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: node md2html.js <input.md> [output.html]');
  console.log('If output file is not specified, it will use the input filename with .html extension');
  process.exit(0);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.md$/, '') + '.html';

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

// Convert markdown to HTML
const htmlContent = marked.parse(markdownContent);

// HTML template
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Viewer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 16px;
      overflow: auto;
    }
    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      padding: 0.2em 0.4em;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    h1, h2, h3, h4 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    h3 {
      font-size: 1.25em;
    }
    h4 {
      font-size: 1em;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }
    table th, table td {
      padding: 8px;
      border: 1px solid #dfe2e5;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    blockquote {
      margin: 0;
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
    }
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }
  </style>
</head>
<body>
  <div id="content">
    ${htmlContent}
  </div>
</body>
</html>`;

// Write HTML to output file
try {
  fs.writeFileSync(outputFile, htmlTemplate);
  console.log(`Successfully converted ${inputFile} to ${outputFile}`);
} catch (error) {
  console.error(`Error writing output file: ${error.message}`);
  process.exit(1);
} 