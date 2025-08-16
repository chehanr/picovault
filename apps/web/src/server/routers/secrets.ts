import { isUniqueConstraintError, secret, secretVersion } from "@picovault/db";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	type FieldError,
	protectedProcedure,
	router,
} from "@/server/trpc/trpc";

const createSecretSchema = z.object({
	projectId: z.string().min(1, "Project ID is required"),
	key: z
		.string()
		.min(1, "Key name is required")
		.max(100, "Key name too long")
		.regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
	value: z.string().min(1, "Secret value is required"),
	description: z.string().max(500, "Description too long").optional(),
});

const updateSecretSchema = z.object({
	id: z.string().min(1, "Secret ID is required"),
	key: z
		.string()
		.min(1, "Key name is required")
		.max(100, "Key name too long")
		.regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed")
		.optional(),
	value: z.string().min(1, "Secret value is required").optional(),
	description: z
		.string()
		.max(500, "Description too long")
		.nullable()
		.optional(),
});

const deleteSecretSchema = z.object({
	id: z.string().min(1, "Secret ID is required"),
});

const listSecretsSchema = z.object({
	projectId: z.string().min(1, "Project ID is required"),
});

export const secretsRouter = router({
	list: protectedProcedure
		.input(listSecretsSchema)
		.query(async ({ ctx, input }) => {
			// Check if user has permission to view secrets in this project
			const hasPermission = await ctx.auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					permissions: {
						secret: ["read"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to view secrets in this project",
				});
			}

			// Fetch secrets with their current versions
			const secrets = await db
				.select({
					id: secret.id,
					key: secret.key,
					description: secret.description,
					currentVersion: secret.currentVersion,
					createdAt: secret.createdAt,
					updatedAt: secret.updatedAt,
				})
				.from(secret)
				.where(eq(secret.projectId, input.projectId))
				.orderBy(desc(secret.createdAt));

			// Fetch the actual secret values
			const secretsWithValues = await Promise.all(
				secrets.map(async (s) => {
					// Get the current version's value
					const [currentVersion] = await db
						.select({
							encryptedValue: secretVersion.encryptedValue,
						})
						.from(secretVersion)
						.where(
							and(
								eq(secretVersion.secretId, s.id),
								eq(secretVersion.version, s.currentVersion),
							),
						)
						.limit(1);

					// TODO: Implement actual decryption
					// For now, just decode from base64
					const decryptedValue = currentVersion?.encryptedValue
						? Buffer.from(currentVersion.encryptedValue, "base64").toString()
						: "";

					return {
						...s,
						value: decryptedValue,
					};
				}),
			);

			return secretsWithValues;
		}),

	create: protectedProcedure
		.input(createSecretSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Check if user has permission to create secrets in this project
			const hasPermission = await ctx.auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					permissions: {
						secret: ["create"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to create secrets in this project",
				});
			}

			try {
				// TODO: Implement actual encryption
				const encryptedValue = Buffer.from(input.value).toString("base64");
				const encryptionKeyId = "default-key"; // Placeholder

				// Create secret with initial version
				const [newSecret] = await db.transaction(async (tx) => {
					// Create the secret
					const [createdSecret] = await tx
						.insert(secret)
						.values({
							projectId: input.projectId,
							key: input.key,
							description: input.description,
							createdBy: userId,
							currentVersion: 1,
						})
						.returning();

					// Create the first version
					await tx.insert(secretVersion).values({
						secretId: createdSecret.id,
						version: 1,
						encryptedValue,
						encryptionKeyId,
						createdBy: userId,
					});

					return [createdSecret];
				});

				return {
					...newSecret,
					value: input.value, // Return unencrypted for UI
				};
			} catch (error) {
				if (isUniqueConstraintError(error, "unique_secret_key_per_project")) {
					const fieldError: FieldError = {
						field: "key",
						type: "unique_violation",
						message: "A secret with this key already exists in this project",
					};

					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A secret with this key already exists in this project",
						cause: fieldError,
					});
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create secret",
				});
			}
		}),

	update: protectedProcedure
		.input(updateSecretSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// Check if user has permission to update secrets
			const hasPermission = await ctx.auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					permissions: {
						secret: ["update"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to update secrets in this project",
				});
			}

			try {
				// Fetch current secret
				const [currentSecret] = await db
					.select()
					.from(secret)
					.where(eq(secret.id, input.id))
					.limit(1);

				if (!currentSecret) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Secret not found",
					});
				}

				const updatedSecret = await db.transaction(async (tx) => {
					// Update secret metadata
					const [updated] = await tx
						.update(secret)
						.set({
							...(input.key !== undefined && { key: input.key }),
							...(input.description !== undefined && {
								description: input.description,
							}),
							updatedAt: new Date(),
						})
						.where(eq(secret.id, input.id))
						.returning();

					// If value is being updated, create a new version
					if (input.value !== undefined) {
						const newVersion = currentSecret.currentVersion + 1;

						// TODO: Implement actual encryption
						const encryptedValue = Buffer.from(input.value).toString("base64");
						const encryptionKeyId = "default-key";

						await tx.insert(secretVersion).values({
							secretId: input.id,
							version: newVersion,
							encryptedValue,
							encryptionKeyId,
							createdBy: userId,
						});

						// Update current version
						await tx
							.update(secret)
							.set({ currentVersion: newVersion })
							.where(eq(secret.id, input.id));
					}

					return updated;
				});

				return {
					...updatedSecret,
					value: input.value || "••••••••••••",
				};
			} catch (error) {
				if (isUniqueConstraintError(error, "unique_secret_key_per_project")) {
					const fieldError: FieldError = {
						field: "key",
						type: "unique_violation",
						message: "A secret with this key already exists in this project",
					};

					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A secret with this key already exists in this project",
						cause: fieldError,
					});
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update secret",
				});
			}
		}),

	delete: protectedProcedure
		.input(deleteSecretSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user has permission to delete secrets
			const hasPermission = await ctx.auth.api.hasPermission({
				headers: ctx.headers,
				body: {
					permissions: {
						secret: ["delete"],
					},
				},
			});

			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to delete secrets in this project",
				});
			}

			try {
				// Delete secret (versions cascade delete)
				const [deletedSecret] = await db
					.delete(secret)
					.where(eq(secret.id, input.id))
					.returning();

				if (!deletedSecret) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Secret not found",
					});
				}

				return { success: true };
			} catch {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete secret",
				});
			}
		}),
});
