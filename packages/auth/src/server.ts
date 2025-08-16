import type { Database } from "@picovault/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	oidcProvider,
	organization as organizationPlugin,
} from "better-auth/plugins";
import { ac, admin, member as memberRole, owner, viewer } from "./permissions";

export type AuthConfig = {
	db: Database;
	secret: string;
	baseURL: string;
	trustedOrigins?: string[];
};

export function createAuth({
	db,
	secret,
	baseURL,
	trustedOrigins = [],
}: AuthConfig) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
		}),
		trustedOrigins,
		emailAndPassword: {
			enabled: true,
		},
		secret,
		baseURL,
		telemetry: {
			enabled: false,
		},
		plugins: [
			organizationPlugin({
				ac,
				roles: {
					owner,
					admin,
					member: memberRole,
					viewer,
				},
				allowUserToCreateOrganization: true,
				organizationLimit: 10,
				creatorRole: "owner",
				membershipLimit: 100,
				invitationExpiresIn: 48 * 60 * 60, // 48 hours
				async sendInvitationEmail(data) {
					// TODO: Implement email sending
					console.log("Invitation email:", {
						to: data.email,
						organisation: data.organization.name,
						invitedBy: data.inviter.user.name,
						invitationId: data.id,
					});
				},
			}),
			oidcProvider({
				loginPage: "/login",
				trustedClients: [
					{
						clientId: "picovault-cli",
						name: "PicoVault CLI",
						type: "public",
						redirectURLs: [
							// Support a range of ports for the CLI callback server
							// The CLI will try to find an available port starting from 8910
							...Array.from(
								{ length: 100 },
								(_, i) => `http://localhost:${8910 + i}/callback`,
							),
						],
						disabled: false,
						skipConsent: true, // Skip consent for CLI
						metadata: {
							internal: true,
							description: "Official PicoVault CLI tool",
						},
					},
				],
				// Allow dynamic client registration for future integrations
				allowDynamicClientRegistration: false,
			}),
		],
	});
}

export type Auth = ReturnType<typeof createAuth>;
