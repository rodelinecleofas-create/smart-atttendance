/**
 * Environment Variable Validator
 * Ensures all required environment variables are set on startup
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const optionalEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
export function validateEnvironment() {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missing
      .map((v) => `  - ${v}`)
      .join('\n')}\n\nPlease add them to .env.local file.`;

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Log optional env vars status
  const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
  if (missingOptional.length > 0) {
    console.warn(
      `Optional environment variables not set: ${missingOptional.join(', ')}`
    );
  }

  console.log('✓ All required environment variables are set');
}

/**
 * Get all configured environment variables
 * @returns {object} Environment configuration
 */
export function getEnvironmentConfig() {
  const config = {};

  for (const envVar of [...requiredEnvVars, ...optionalEnvVars]) {
    if (process.env[envVar]) {
      config[envVar] = process.env[envVar];
    }
  }

  return config;
}

/**
 * Check if a specific environment variable is set
 * @param {string} envVar - Environment variable name
 * @returns {boolean}
 */
export function isEnvVarSet(envVar) {
  return !!process.env[envVar];
}
