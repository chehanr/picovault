import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";
import type { SessionEntry } from "../schema/storage";
import { addSession } from "./storage";

export const oAuthTokenResponseSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	token_type: z.string(),
	expires_in: z.number(),
	scope: z.string().optional(),
});

export type OAuthTokenResponse = z.infer<typeof oAuthTokenResponseSchema>;

export const oAuthUserInfoSchema = z.object({
	sub: z.string(),
	email: z.string().email(),
	name: z.string(),
	picture: z.string().nullable().optional(),
	email_verified: z.boolean().nullable().optional(),
});

export type OAuthUserInfo = z.infer<typeof oAuthUserInfoSchema>;

/**
 * Generate a cryptographically secure random string for state parameter
 */
export function generateRandomString(length: number): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);

	// Convert to base64url encoding
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

export const OAUTH_CONFIG = {
	clientId: "picovault-cli",
	scope: "openid profile email offline_access",
} as const;

export function buildAuthorisationUrl(
	instanceUrl: string,
	state: string,
	codeChallenge: string,
	port: number,
): string {
	const params = new URLSearchParams({
		client_id: OAUTH_CONFIG.clientId,
		redirect_uri: `http://localhost:${port}/callback`,
		response_type: "code",
		scope: OAUTH_CONFIG.scope,
		state,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
	});

	// Redirect to login page with OAuth parameters
	// The login page will handle authentication and then redirect to OAuth2 authorize
	return `${instanceUrl}/login?${params.toString()}`;
}

export async function exchangeCodeForTokens(
	instanceUrl: string,
	code: string,
	codeVerifier: string,
	port: number,
): Promise<OAuthTokenResponse> {
	const { data, error } = await betterFetch(
		`${instanceUrl}/api/auth/oauth2/token`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				client_id: OAUTH_CONFIG.clientId,
				redirect_uri: `http://localhost:${port}/callback`,
				code_verifier: codeVerifier,
			}).toString(),
			output: oAuthTokenResponseSchema,
		},
	);

	if (error) {
		throw new Error(
			`Token exchange failed: ${error.message || error.statusText || "Unknown error"}`,
		);
	}

	return data;
}

export async function getUserInfo(
	instanceUrl: string,
	accessToken: string,
): Promise<OAuthUserInfo> {
	const { data, error } = await betterFetch(
		`${instanceUrl}/api/auth/oauth2/userinfo`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			output: oAuthUserInfoSchema,
		},
	);

	if (error) {
		throw new Error(
			`Failed to get user info: ${error.message || error.statusText || "Unknown error"}`,
		);
	}

	return data;
}

export async function refreshAccessToken(
	session: SessionEntry,
): Promise<SessionEntry> {
	const { data, error } = await betterFetch(
		`${session.instanceUrl}/api/auth/oauth2/token`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: session.oauth.refreshToken,
				client_id: OAUTH_CONFIG.clientId,
			}).toString(),
			output: oAuthTokenResponseSchema,
		},
	);

	if (error) {
		throw new Error(
			`Token refresh failed: ${error.message || error.statusText || "Unknown error"}`,
		);
	}

	// Create updated session with new tokens
	const updatedSession: SessionEntry = {
		...session,
		oauth: {
			...session.oauth,
			accessToken: data.access_token,
			refreshToken: data.refresh_token || session.oauth.refreshToken,
			expiresAt: new Date(
				Date.now() + (data.expires_in || 3600) * 1000,
			).toISOString(),
		},
	};

	await addSession(updatedSession);

	return updatedSession;
}

export function isTokenExpired(session: SessionEntry): boolean {
	const expiresAt = new Date(session.oauth.expiresAt);
	const now = new Date();
	// Consider token expired if it expires within the next 5 minutes
	const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds

	return expiresAt.getTime() <= now.getTime() + buffer;
}

export async function ensureValidToken(
	session: SessionEntry,
): Promise<SessionEntry> {
	if (isTokenExpired(session)) {
		return refreshAccessToken(session);
	}

	return session;
}
