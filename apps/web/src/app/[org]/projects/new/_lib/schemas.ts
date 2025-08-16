import { z } from "zod";

export const projectCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Project name is required")
		.max(100, "Project name too long")
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			"Only letters, numbers, spaces, hyphens and underscores allowed",
		),
	description: z.string().max(500, "Description too long").optional(),
});

export type ProjectCreateFormData = z.infer<typeof projectCreateSchema>;
