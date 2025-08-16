import { DrizzleQueryError } from "drizzle-orm/errors";

/**
 * Checks if an error is a unique constraint violation for a specific constraint
 * @param error The caught error from database operations
 * @param constraintName The name of the constraint to check for
 * @returns true if the error is a unique violation for the specified constraint
 */
export function isUniqueConstraintError(
	error: unknown,
	constraintName: string,
): boolean {
	if (error instanceof DrizzleQueryError) {
		const cause = error.cause;
		if (cause && typeof cause === "object" && "code" in cause) {
			// Check for PostgreSQL unique constraint violation (code 23505)
			return (
				cause.code === "23505" &&
				"constraint" in cause &&
				cause.constraint === constraintName
			);
		}
	}
	return false;
}
