import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	DATABASE_URL: z.string(),
	CORS_ORIGIN: z.string().default("http://localhost:3001"),
	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
	NEXT_PUBLIC_SERVER_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
