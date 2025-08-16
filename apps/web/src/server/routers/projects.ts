import { isUniqueConstraintError, project } from "@picovault/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/db";
import {
	type FieldError,
	protectedProcedure,
	router,
} from "@/server/trpc/trpc";

const createProjectSchema = z.object({
	name: z
		.string()
		.min(1, "Project name is required")
		.max(100, "Project name too long")
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			"Only letters, numbers, spaces, hyphens and underscores allowed",
		),
	description: z.string().max(500, "Description too long").optional(),
	organisationId: z.string().min(1, "Organisation ID is required"),
});

export const projectsRouter = router({
	create: protectedProcedure
		.input(createProjectSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Check if user has permission to create projects in this organization
			const hasPermission = await ctx.auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					permissions: {
						project: ["create"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to create projects in this organization",
				});
			}

			try {
				// Create project
				const [newProject] = await db
					.insert(project)
					.values({
						name: input.name,
						description: input.description,
						organizationId: input.organisationId,
						createdBy: userId,
					})
					.returning();

				return newProject;
			} catch (error) {
				if (isUniqueConstraintError(error, "unique_project_name_per_org")) {
					const fieldError: FieldError = {
						field: "name",
						type: "unique_violation",
						message:
							"A project with this name already exists in this organization",
					};

					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"A project with this name already exists in this organization",
						cause: fieldError,
					});
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create project",
				});
			}
		}),
});
