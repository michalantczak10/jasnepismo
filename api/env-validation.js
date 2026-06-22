function validateEnvironment() {
  const errors = [];
  const warnings = [];

  const isTest =
    process.env.NODE_ENV === 'test' ||
    process.env.CI === 'true' ||
    process.env.npm_config_test === 'true' ||
    process.argv.some((arg) => arg.includes('test') || arg.includes('spec'));

  const required = {
    OPENAI_API_KEY: 'OpenAI API key is required for text generation',
  };

  const optional = {
    OPENAI_MODEL: 'gpt-3.5-turbo',
    OPENAI_FALLBACK_MODEL: 'gpt-3.5-turbo',
    REDIS_URL: null,
    UPSTASH_REDIS_REST_URL: null,
    UPSTASH_REDIS_REST_TOKEN: null,
    OCR_WORKER_URL: null,
    OCR_CONCURRENCY: '1',
    OCR_TIMEOUT_MS: '20000',
    OCR_WORKER_TIMEOUT_MS: '20000',
  };

  for (const [key, defaultValue] of Object.entries(optional)) {
    if (defaultValue !== null && !process.env[key]) {
      process.env[key] = defaultValue;
      warnings.push(`Set default value for ${key}: ${defaultValue}`);
    }
  }

  if (!isTest) {
    for (const [key, message] of Object.entries(required)) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key} (${message})`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach((err) => console.error('  ERROR:', err));
    if (!isTest) {
      throw new Error('Environment validation failed');
    }
  }

  if (warnings.length > 0) {
    console.warn('Environment warnings:');
    warnings.forEach((warn) => console.warn('  WARNING:', warn));
  }

  return { valid: true, errors, warnings, isTest };
}

module.exports = { validateEnvironment };
