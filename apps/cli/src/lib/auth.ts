import chalk from "chalk";
import open from "open";
import ora from "ora";
import pkceChallenge from "pkce-challenge";
import type { SessionEntry } from "../schema/storage";
import {
	buildAuthorisationUrl,
	exchangeCodeForTokens,
	generateRandomString,
	getUserInfo,
	type OAuthTokenResponse,
	type OAuthUserInfo,
} from "./oauth";
import { startAuthServer } from "./server";
import { addSession } from "./storage";

export interface AuthOptions {
	instanceUrl: string;
}

export async function authenticate(options: AuthOptions): Promise<void> {
	const spinner = ora("Starting authentication...").start();

	try {
		const pkce = await pkceChallenge();
		const state = generateRandomString(32);

		const { port, close } = await startAuthServer({
			onSuccess: async (params) => {
				if (params.error) {
					spinner.fail(
						`Authentication failed: ${params.error_description || params.error}`,
					);
					close();
					return;
				}

				if (!params.state || params.state !== state) {
					spinner.fail("Authentication failed: Invalid state parameter");
					close();
					return;
				}

				if (!params.code) {
					spinner.fail("Authentication failed: No authorisation code received");
					close();
					return;
				}

				spinner.text = "Exchanging authorisation code for tokens...";

				try {
					const tokens = await exchangeCodeForTokens(
						options.instanceUrl,
						params.code,
						pkce.code_verifier,
						port,
					);

					spinner.text = "Fetching user information...";
					const userInfo = await getUserInfo(
						options.instanceUrl,
						tokens.access_token,
					);

					await handleOAuthSuccess(
						{
							...tokens,
							userInfo,
						},
						options.instanceUrl,
					);

					spinner.succeed("Authentication successful!");
					close();
				} catch (error) {
					spinner.fail(`Token exchange failed: ${(error as Error).message}`);
					close();
				}
			},
			onError: (error) => {
				spinner.fail(`Authentication failed: ${error.message}`);
				close();
			},
		});

		const authUrl = buildAuthorisationUrl(
			options.instanceUrl,
			state,
			pkce.code_challenge,
			port,
		);

		spinner.text = "Opening browser for authentication...";

		await open(authUrl);

		spinner.text = "Waiting for authorisation... (check your browser)";
	} catch (error) {
		spinner.fail(`Failed to start authentication: ${(error as Error).message}`);
		throw error;
	}
}

type OAuthSuccessData = OAuthTokenResponse & {
	userInfo: OAuthUserInfo;
};

async function handleOAuthSuccess(
	data: OAuthSuccessData,
	instanceUrl: string,
): Promise<void> {
	const session: SessionEntry = {
		instanceUrl,
		oauth: {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			tokenType: data.token_type || "Bearer",
			expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
			scope: data.scope || undefined,
		},
		user: {
			id: data.userInfo.sub,
			email: data.userInfo.email,
			name: data.userInfo.name,
		},
		createdAt: new Date().toISOString(),
	};

	await addSession(session);

	console.log(
		chalk.green("\nSuccessfully authenticated to"),
		chalk.cyan(instanceUrl),
	);
	console.log(chalk.gray("  User:"), session.user.email);
	console.log(
		chalk.gray("  Token expires:"),
		new Date(session.oauth.expiresAt).toLocaleString(),
	);
}
