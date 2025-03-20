/**
 * OpenAI configuration
 * Contains model names and token cost information
 */
const config = {
  // Default models
  models: {
    // Model for commit analysis
    commitAnalysis: 'gpt-4o',
    // Model for report generation
    reportGeneration: 'gpt-4o-mini',
  },
  
  // Token limits
  tokenLimits: {
    commitAnalysisMaxTokens: 300,
    reportGenerationMaxTokens: 2500,
  },
  
  // Temperature settings
  temperature: {
    commitAnalysis: 0.7,
    reportGeneration: 0.7,
  }
};

module.exports = config; 