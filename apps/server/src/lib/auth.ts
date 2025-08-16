import { type Auth, createAuth } from "@picovault/auth/server";
import { db } from "../db";
import { env } from "./env";

export const auth: Auth = createAuth({
	db,
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [env.CORS_ORIGIN || ""],
});
