# Configuration System

This document explains how the configuration system works in the GitStatus backend.

## Configuration Files

Configuration files are stored in the `backend/config` directory. Each file represents a specific service or component of the application. These files contain direct configuration values that are used throughout the application.

## OpenAI Configuration

The OpenAI service configuration is defined in `backend/config/openai.js` with the following settings:

### Models

- `commitAnalysis`: The model used for analyzing commits (default: 'gpt-4o')
- `reportGeneration`: The model used for generating reports (default: 'gpt-4o-mini')

### Token Limits

- `commitAnalysisMaxTokens`: Maximum tokens for commit analysis (default: 300)
- `reportGenerationMaxTokens`: Maximum tokens for report generation (default: 2500)

### Temperature Settings

- `commitAnalysis`: Temperature for commit analysis (default: 0.7)
- `reportGeneration`: Temperature for report generation (default: 0.7)

## Usage

To use a configuration value in your code, import the relevant configuration file:

```javascript
const openaiConfig = require('../config/openai');

// Use the configuration
const model = openaiConfig.models.commitAnalysis;
const maxTokens = openaiConfig.tokenLimits.commitAnalysisMaxTokens;
```

## Modifying Configuration

To modify configuration parameters:

1. Edit the relevant configuration file in `backend/config/`
2. Update this documentation with details about the modified configuration options

## Best Practices

- Group related configuration in the same file
- Use descriptive names for configuration properties
- Keep configuration files organized by service or functionality
- Document any changes to configuration values 