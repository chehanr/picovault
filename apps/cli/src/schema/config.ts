import { z } from "zod";

export const picoVaultConfigSchema = z.object({
	defaultInstance: z.string().url().optional(),
	projectId: z.string().optional(),
	organisationSlug: z.string().optional(),
});

export type PicoVaultConfig = z.infer<typeof picoVaultConfigSchema>;
