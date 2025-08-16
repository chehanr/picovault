import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const project = pgTable(
	"project",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => ({
		uniqueProjectNamePerOrg: unique("unique_project_name_per_org").on(
			table.organizationId,
			table.name,
		),
	}),
);

export const secret = pgTable(
	"secret",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		key: text("key").notNull(),
		description: text("description"),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		currentVersion: integer("current_version").default(1).notNull(),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => ({
		uniqueSecretKeyPerProject: unique("unique_secret_key_per_project").on(
			table.projectId,
			table.key,
		),
	}),
);

export const secretVersion = pgTable(
	"secret_version",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		secretId: text("secret_id")
			.notNull()
			.references(() => secret.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
		encryptedValue: text("encrypted_value").notNull(),
		encryptionKeyId: text("encryption_key_id").notNull(),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => ({
		uniqueSecretVersion: unique("unique_secret_version").on(
			table.secretId,
			table.version,
		),
	}),
);

export const projectRelations = relations(project, ({ one, many }) => ({
	organization: one(organization, {
		fields: [project.organizationId],
		references: [organization.id],
	}),
	createdBy: one(user, {
		fields: [project.createdBy],
		references: [user.id],
	}),
	secrets: many(secret),
}));

export const secretRelations = relations(secret, ({ one, many }) => ({
	project: one(project, {
		fields: [secret.projectId],
		references: [project.id],
	}),
	createdBy: one(user, {
		fields: [secret.createdBy],
		references: [user.id],
	}),
	versions: many(secretVersion),
}));

export const secretVersionRelations = relations(secretVersion, ({ one }) => ({
	secret: one(secret, {
		fields: [secretVersion.secretId],
		references: [secret.id],
	}),
	createdBy: one(user, {
		fields: [secretVersion.createdBy],
		references: [user.id],
	}),
}));
