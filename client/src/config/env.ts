/**
 * Environment Variables Configuration
 * Validates and provides type-safe access to environment variables
 * Ensures all required environment variables are available at runtime
 */

// Validate required environment variables
const requiredEnvVars = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
} as const;

// Check if all required variables are defined
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Export validated environment variables
export const env = {
  API_URL: requiredEnvVars.VITE_API_URL,
  SOCKET_URL: requiredEnvVars.VITE_SOCKET_URL,
  NODE_ENV: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === "development",
  isProduction: import.meta.env.MODE === "production",
} as const;

export type Env = typeof env;
