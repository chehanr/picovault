import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as authSchema from "./schema/auth";

// Re-export drizzle-orm so all packages use the same instance
export * as drizzle from "drizzle-orm";

export * from "./schema";
export * from "./schema/auth";
export * from "./utils";

export type Database = NodePgDatabase<typeof schema & typeof authSchema>;

export function createDatabase(databaseUrl: string): Database {
	return drizzle(databaseUrl, {
		schema: { ...authSchema, ...schema },
	});
}
