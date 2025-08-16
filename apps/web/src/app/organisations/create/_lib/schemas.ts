import { z } from "zod";

export const organisationCreateSchema = z.object({
	name: z
		.string()
		.min(1, "Organisation name is required")
		.max(100, "Organisation name too long")
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			"Only letters, numbers, spaces, hyphens and underscores allowed",
		),
	slug: z
		.string()
		.min(1, "Organisation slug is required")
		.max(50, "Organisation slug too long")
		.regex(
			/^[a-z0-9-]+$/,
			"Slug must contain only lowercase letters, numbers and hyphens",
		)
		.regex(
			/^[a-z0-9].*[a-z0-9]$|^[a-z0-9]$/,
			"Slug must start and end with letter or number",
		),
	description: z.string().max(500, "Description too long").optional(),
});

export type OrganisationCreateFormData = z.infer<
	typeof organisationCreateSchema
>;
