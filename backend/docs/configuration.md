# Configuration System

This document explains how the configuration system works in the GitStatus backend.

## Environment Variables

All configuration is managed through environment variables that can be set in the `.env` file at the root of the backend directory. The application uses a layered configuration system where environment variables are loaded into configuration objects that are then used throughout the application.

## Configuration Files

Configuration files are stored in the `backend/config` directory. Each file represents a specific service or component of the application. The configuration files read values from environment variables and provide sensible defaults.

## OpenAI Configuration

The OpenAI service uses the following configuration options:

### Models

- `OPENAI_COMMIT_MODEL`: The model used for analyzing commits (default: 'gpt-4o')
- `OPENAI_REPORT_MODEL`: The model used for generating reports (default: 'gpt-4o-mini')

### Token Limits

- `OPENAI_COMMIT_MAX_TOKENS`: Maximum tokens for commit analysis (default: 300)
- `OPENAI_REPORT_MAX_TOKENS`: Maximum tokens for report generation (default: 2500)

### Temperature Settings

- `OPENAI_COMMIT_TEMPERATURE`: Temperature for commit analysis (default: 0.7)
- `OPENAI_REPORT_TEMPERATURE`: Temperature for report generation (default: 0.7)

## Usage

To use a configuration value in your code, import the relevant configuration file:

```javascript
const openaiConfig = require('../config/openai');

// Use the configuration
const model = openaiConfig.models.commitAnalysis;
const maxTokens = openaiConfig.tokenLimits.commitAnalysisMaxTokens;
```

## Adding New Configuration

To add new configuration parameters:

1. Add the environment variable to your `.env` file with an appropriate default value
2. Create or update the relevant configuration file in `backend/config/`
3. Update this documentation with details about the new configuration options

## Best Practices

- Always provide sensible defaults for all configuration values
- Use environment-specific overrides through the `.env` file
- Never hardcode configuration values directly in application code
- Group related configuration in the same file
- Use descriptive names for configuration properties 