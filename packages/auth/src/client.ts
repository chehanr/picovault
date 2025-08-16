import { oidcClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, member, owner, viewer } from "./permissions";

export type AuthClientConfig = {
	baseURL?: string;
};

export function createClient({ baseURL }: AuthClientConfig = {}) {
	return createAuthClient({
		baseURL,
		telemetry: {
			enabled: false,
		},
		plugins: [
			organizationClient({
				ac,
				roles: {
					owner,
					admin,
					member,
					viewer,
				},
			}),
			oidcClient(),
		],
	});
}
