import type { Secret } from "../schema/secrets";

/**
 * Prepare environment variables by merging secrets with existing environment
 */
export function prepareEnvironment(secrets: Secret[]): NodeJS.ProcessEnv {
	const env = { ...process.env };

	for (const secret of secrets) {
		// Sanitise the key to ensure it's a valid environment variable name
		const envKey = sanitiseEnvKey(secret.key);
		env[envKey] = secret.value;
	}

	return env;
}

/**
 * Sanitise a secret key to make it a valid environment variable name
 * - Replace invalid characters with underscore
 * - Convert to uppercase by convention
 */
export function sanitiseEnvKey(key: string): string {
	// Environment variable names should only contain letters, numbers, and underscores
	// They should not start with a number
	let sanitised = key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

	// If it starts with a number, prefix with underscore
	if (/^[0-9]/.test(sanitised)) {
		sanitised = `_${sanitised}`;
	}

	return sanitised;
}
