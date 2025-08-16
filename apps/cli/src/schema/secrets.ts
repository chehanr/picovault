import { z } from "zod";

export const secretSchema = z.object({
	key: z.string(),
	value: z.string(),
	type: z.enum(["text", "password", "token"]),
});

export type Secret = z.infer<typeof secretSchema>;

export const secretsResponseSchema = z.object({
	secrets: z.array(secretSchema),
});

export type SecretsResponse = z.infer<typeof secretsResponseSchema>;
