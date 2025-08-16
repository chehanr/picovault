import { createDatabase } from "@picovault/db";
import { env } from "../lib/env";

export const db = createDatabase(env.DATABASE_URL || "");
