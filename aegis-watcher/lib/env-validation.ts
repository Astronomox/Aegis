/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const envConfigs: EnvVarConfig[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: false, // Optional for mock mode
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'Must be a valid HTTPS URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: false, // Optional for mock mode
    validator: (value) => value.length > 50,
    errorMessage: 'Must be a valid Supabase anon key',
  },
  {
    name: 'AEGIS_PASSCODE',
    required: false, // Optional for demo mode
    validator: (value) => /^\d{4,6}$/.test(value),
    errorMessage: 'Must be a 4-6 digit passcode',
  },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const config of envConfigs) {
    const value = process.env[config.name];

    if (config.required && !value) {
      errors.push(`Required environment variable ${config.name} is missing`);
      continue;
    }

    if (value && config.validator && !config.validator(value)) {
      const errorMsg = config.errorMessage || `Invalid value for ${config.name}`;
      errors.push(`${config.name}: ${errorMsg}`);
    }

    if (!value && !config.required) {
      warnings.push(`Optional environment variable ${config.name} is not set (app will run in mock mode)`);
    }
  }

  // Check for NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    warnings.push('NODE_ENV is not set (defaulting to development)');
  } else if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: development, production, test (got: ${nodeEnv})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateEnvOrThrow(): void {
  const result = validateEnv();
  
  if (!result.valid) {
    throw new Error(
      `Environment validation failed:\n${result.errors.map(e => `  - ${e}`).join('\n')}`
    );
  }

  if (result.warnings.length > 0) {
    console.warn('Environment warnings:');
    result.warnings.forEach(w => console.warn(`  - ${w}`));
  }
}

// Get a safe environment variable with fallback
export function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined && fallback === undefined) {
    throw new Error(`Environment variable ${name} is not set and no fallback provided`);
  }
  return value || fallback || '';
}

// Check if running in mock mode
export function isMockMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
