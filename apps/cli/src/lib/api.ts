import { betterFetch } from "@better-fetch/fetch";
import type { Secret } from "../schema/secrets";
import { secretsResponseSchema } from "../schema/secrets";

export class ApiClient {
	private baseUrl: string;

	constructor(instanceUrl: string) {
		// Ensure the base URL doesn't have a trailing slash
		this.baseUrl = instanceUrl.replace(/\/$/, "");
	}

	async fetchSecrets(
		accessToken: string,
		options?: {
			projectId?: string;
			organisationSlug?: string;
		},
	): Promise<Secret[]> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		if (options?.projectId) {
			headers["X-Project-Id"] = options.projectId;
		}
		if (options?.organisationSlug) {
			headers["X-Organisation-Slug"] = options.organisationSlug;
		}

		const { data, error } = await betterFetch(
			`${this.baseUrl}/api/picovault/secrets`,
			{
				method: "GET",
				headers,
				output: secretsResponseSchema,
			},
		);

		if (error) {
			if (error.status === 401) {
				throw new Error(
					"Authentication failed. Your session may have expired.",
				);
			}
			if (error.status === 403) {
				throw new Error(
					"Access denied. You may not have permission to access secrets.",
				);
			}
			if (error.status && error.status >= 500) {
				throw new Error("Server error. Please try again later.");
			}

			throw new Error(
				error.message || error.statusText || "Failed to fetch secrets",
			);
		}

		return data.secrets;
	}
}
