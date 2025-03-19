const fs = require('fs').promises;
const path = require('path');
const { Tiktoken } = require('@dqbd/tiktoken');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-api-key' });

// Initialize Tiktoken with cl100k_base encoding (closest approximation for Claude)
const tokenizer = new Tiktoken({ chat_system_prompt: '', model: 'cl100k_base' });

async function readCodebase(dir, maxSizeMB = 5) {
  const ignoreDirs = ['node_modules', 'dist', 'build', '.git', 'coverage', '.next', '.cache'];
  let codebase = '';
  let totalSize = 0;
  const files = await fs.readdir(dir, { withFileTypes: true });
  console.log(`Analyzing ${files.length} files in ${path.relative(__dirname, dir)}...`);
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(__dirname, fullPath);
    if (file.isDirectory()) {
      if (ignoreDirs.includes(file.name)) {
        console.log(`Skipping ${file.name} directory...`);
        continue;
      }
      const subDirContent = await readCodebase(fullPath, maxSizeMB - totalSize);
      codebase += subDirContent.content;
      totalSize += subDirContent.size;
    } else if (
      file.name.match(/\.(js|jsx|md|css)$/) || 
      file.name === 'package.json' && !file.name.includes('package-lock.json')
    ) {
      const stats = await fs.stat(fullPath);
      const sizeMB = stats.size / (1024 * 1024);
      if (totalSize + sizeMB > maxSizeMB) {
        console.log(`Skipping ${relativePath} - exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      const content = await fs.readFile(fullPath, 'utf-8');
      codebase += `---\nFile: ${relativePath}\n---\n${content}\n\n`;
      totalSize += sizeMB;
    }
  }
  console.log(`Total size in ${dir}: ${totalSize.toFixed(2)} MB`);
  return { content: codebase, size: totalSize };
}

async function readDocs() {
  const docFiles = ['BIBLE.md', 'APP_DOCS.md']; // Add paths to additional docs if needed
  let docsContent = '';
  for (const docFile of docFiles) {
    try {
      const fullPath = path.join(__dirname, docFile); // Adjust path if docs are in a subfolder
      const content = await fs.readFile(fullPath, 'utf-8');
      docsContent += `---\nFile: ${docFile}\n---\n${content}\n\n`;
    } catch (err) {
      console.warn(`Could not read ${docFile}: ${err.message}`);
    }
  }
  return docsContent;
}

async function buildPrompt() {
  // Gather codebase from ./frontend and ./backend
  const frontendContent = await readCodebase(path.join(__dirname, 'frontend'));
  const backendContent = await readCodebase(path.join(__dirname, 'backend'));
  const docsContent = await readDocs();

  const codebase = `${frontendContent.content}${backendContent.content}${docsContent}`;
  return `
You are an expert full-stack developer and code auditor with deep knowledge of React (JS/JSX), Express.js, and MongoDB. The codebase below is a ~10k-line MVP called GitStatus, which analyzes GitHub commit history to generate AI-powered reports. I’ve made significant changes, including removing hardcoded API keys, adding PDF watermarking, and separating concerns into smaller, single-duty units. Note: The app is likely broken and won’t deploy due to untested changes, but the code is cleaner and more modular. I’ve included the current Claude Bible (\`BIBLE.md\`), app docs (\`APP_DOCS.md\`), and additional documentation for reference. This is a sample run to calibrate token usage—summarize the codebase structure and estimate its size in lines.

---

${codebase}

---

### Instructions
- Summarize the codebase structure (e.g., key directories, file types).
- Estimate the total lines of code (excluding comments and blank lines if possible).
- Note: This is a sample run to calibrate token usage—keep the response concise.
`;
}

async function calibrateTokens() {
  // Build the full prompt
  const prompt = await buildPrompt();
  await fs.writeFile('full_prompt.txt', prompt, 'utf-8');
  console.log('Full prompt saved to full_prompt.txt');

  // Estimate tokens with Tiktoken
  const tiktokenTokens = tokenizer.encode(prompt).length;
  const tiktokenFudgedTokens = Math.ceil(tiktokenTokens * 1.25);
  console.log(`Tiktoken estimated tokens: ${tiktokenTokens.toLocaleString()}`);
  console.log(`Tiktoken fudged tokens (25% increase): ${tiktokenFudgedTokens.toLocaleString()}`);

  // Extract a ~1000-token sample (per Tiktoken)
  const targetSampleTokens = 1000;
  let sampleText = '';
  let currentTokens = 0;
  const lines = prompt.split('\n');
  for (const line of lines) {
    sampleText += line + '\n';
    currentTokens = tokenizer.encode(sampleText).length;
    if (currentTokens >= targetSampleTokens) break;
  }
  const sampleTokens = tokenizer.encode(sampleText).length;
  console.log(`Sample size (Tiktoken): ${sampleTokens} tokens`);

  // Send the sample to Anthropic
  console.log('Sending sample to Claude 3.7 Sonnet...');
  let anthropicInputTokens = 0;
  let anthropicOutputTokens = 0;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20241022',
      messages: [{ role: 'user', content: sampleText }],
      max_tokens: 1000
    });
    anthropicInputTokens = response.usage.input_tokens;
    anthropicOutputTokens = response.usage.output_tokens;
    console.log(`Anthropic reported input tokens: ${anthropicInputTokens}`);
    console.log(`Anthropic reported output tokens: ${anthropicOutputTokens}`);
  } catch (err) {
    console.error(`Error sending sample: ${err.message}`);
    return;
  }

  // Calibrate token estimation
  const tiktokenToAnthropicRatio = anthropicInputTokens / sampleTokens;
  console.log(`Tiktoken to Anthropic ratio: ${tiktokenToAnthropicRatio.toFixed(2)}`);

  // Adjust full prompt estimate
  const adjustedTokens = Math.ceil(tiktokenTokens * tiktokenToAnthropicRatio);
  console.log(`Adjusted full prompt tokens (based on Anthropic ratio): ${adjustedTokens.toLocaleString()}`);
}

calibrateTokens().then(() => {
  console.log('Calibration done!');
}).catch(err => {
  console.error('Error:', err);
});