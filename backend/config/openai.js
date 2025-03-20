/**
 * OpenAI configuration
 * Contains model names and token cost information
 */
const config = {
  // Default models
  models: {
    // Model for commit analysis
    commitAnalysis: process.env.OPENAI_COMMIT_MODEL || 'gpt-4-mini',
    // Model for report generation
    reportGeneration: process.env.OPENAI_REPORT_MODEL || 'gpt-4o-mini',
  },
  
  // Token limits
  tokenLimits: {
    commitAnalysisMaxTokens: parseInt(process.env.OPENAI_COMMIT_MAX_TOKENS || '300'),
    reportGenerationMaxTokens: parseInt(process.env.OPENAI_REPORT_MAX_TOKENS || '2500'),
  },
  
  // Temperature settings
  temperature: {
    commitAnalysis: parseFloat(process.env.OPENAI_COMMIT_TEMPERATURE || '0.7'),
    reportGeneration: parseFloat(process.env.OPENAI_REPORT_TEMPERATURE || '0.7'),
  }
};

module.exports = config; 