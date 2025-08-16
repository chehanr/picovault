import { z } from "zod";

export const sessionEntrySchema = z.object({
	instanceUrl: z.string().url(),
	oauth: z.object({
		accessToken: z.string(),
		refreshToken: z.string(),
		tokenType: z.string().default("Bearer"),
		expiresAt: z.string().datetime(),
		scope: z.string().optional(),
	}),
	user: z.object({
		id: z.string(),
		email: z.string().email(),
		name: z.string(),
	}),
	createdAt: z.string().datetime(),
});

export const sessionStorageSchema = z.object({
	sessions: z.array(sessionEntrySchema),
	activeContext: z
		.object({
			instanceUrl: z.string().url(),
		})
		.optional(),
});

export type SessionEntry = z.infer<typeof sessionEntrySchema>;
export type SessionStorage = z.infer<typeof sessionStorageSchema>;
