import {
	drizzle,
	member,
	organization,
	project,
	secret,
	secretVersion,
} from "@picovault/db";
import { Hono } from "hono";
import { db } from "../db";
import { type AuthContext, authMiddleware } from "../middleware/auth";

const { and, eq } = drizzle;

type SecretResponse = {
	key: string;
	value: string;
	type: "text" | "password" | "token";
};

type SecretsListResponse = {
	secrets: SecretResponse[];
};

const secrets = new Hono<{
	Variables: AuthContext;
}>();

secrets.use("*", authMiddleware);

secrets.get("/", async (c) => {
	const user = c.get("user");
	const projectId = c.req.header("X-Project-Id");
	const organisationSlug = c.req.header("X-Organisation-Slug");

	try {
		const memberships = await db
			.select()
			.from(member)
			.where(eq(member.userId, user.id));

		if (memberships.length === 0) {
			return c.json({ error: "No organization membership found" }, 403);
		}

		let targetOrgId: string;

		// If organisationSlug is provided, resolve it to organizationId
		if (organisationSlug) {
			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.slug, organisationSlug))
				.limit(1);

			if (!org) {
				return c.json({ error: "Organisation not found" }, 404);
			}

			// Verify user is a member of this organisation
			const isMember = memberships.some((m) => m.organizationId === org.id);
			if (!isMember) {
				return c.json({ error: "Not a member of this organisation" }, 403);
			}

			targetOrgId = org.id;
		} else {
			// Use the first organisation the user is a member of
			targetOrgId = memberships[0].organizationId;
		}

		// Get projects for the organisation
		const projectsQuery = projectId
			? db
					.select()
					.from(project)
					.where(
						and(
							eq(project.organizationId, targetOrgId),
							eq(project.id, projectId),
						),
					)
			: db
					.select()
					.from(project)
					.where(eq(project.organizationId, targetOrgId));

		const projects = await projectsQuery;

		if (projects.length === 0) {
			return c.json<SecretsListResponse>({ secrets: [] });
		}

		// Get secrets for all projects with their current versions
		const allSecrets: SecretResponse[] = [];

		for (const proj of projects) {
			// Get secrets for this project
			const secrets = await db
				.select({
					id: secret.id,
					key: secret.key,
					currentVersion: secret.currentVersion,
				})
				.from(secret)
				.where(eq(secret.projectId, proj.id));

			// Get the current version values
			for (const s of secrets) {
				const [version] = await db
					.select()
					.from(secretVersion)
					.where(
						and(
							eq(secretVersion.secretId, s.id),
							eq(secretVersion.version, s.currentVersion),
						),
					)
					.limit(1);

				if (version?.encryptedValue) {
					// TODO: Implement actual decryption
					// For now, just decode from base64
					const decryptedValue = Buffer.from(
						version.encryptedValue,
						"base64",
					).toString();

					allSecrets.push({
						key: s.key,
						value: decryptedValue,
						type: "text", // Default type for now
					});
				}
			}
		}

		return c.json<SecretsListResponse>({ secrets: allSecrets });
	} catch (error) {
		console.error("Error fetching secrets:", error);
		return c.json({ error: "Failed to fetch secrets" }, 500);
	}
});

export { secrets };
