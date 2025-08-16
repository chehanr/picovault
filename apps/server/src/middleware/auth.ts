import { betterFetch } from "@better-fetch/fetch";
import type { Context, MiddlewareHandler, Next } from "hono";
import { z } from "zod";

const userSchema = z.object({
	sub: z.string(),
	email: z.string().email(),
	name: z.string(),
	email_verified: z.boolean().optional(),
	picture: z.string().nullable().optional(),
});

type User = {
	id: string;
	email: string;
	name: string;
	emailVerified: boolean;
	image: string | null;
};

export type AuthContext = {
	user: User;
};

export const authMiddleware: MiddlewareHandler<{
	Variables: AuthContext;
}> = async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return c.json(
			{ error: "Unauthorised: Missing or invalid Authorization header" },
			401,
		);
	}

	const token = authHeader.substring(7);

	try {
		const { data, error } = await betterFetch(
			`${c.req.url.split("/api/")[0]}/api/auth/oauth2/userinfo`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
				output: userSchema,
			},
		);

		if (error) {
			return c.json({ error: "Unauthorised: Invalid or expired token" }, 401);
		}

		// Map OIDC UserInfo to our User format
		const user: User = {
			id: data.sub,
			email: data.email,
			emailVerified: data.email_verified || false,
			name: data.name,
			image: data.picture || null,
		};

		c.set("user", user);

		return next();
	} catch (error) {
		console.error("Authentication error:", error);
		return c.json({ error: "Unauthorised: Failed to validate token" }, 401);
	}
};
