import chalk from "chalk";
import ora from "ora";
import { ApiClient } from "../lib/api";
import { loadConfig } from "../lib/config";
import { prepareEnvironment } from "../lib/environment";
import { ensureValidToken } from "../lib/oauth";
import { executeCommand } from "../lib/process";
import { getActiveSession } from "../lib/storage";
import type { Secret } from "../schema/secrets";

interface RunCommandOptions {
	instance?: string;
}

export async function runCommand(
	command: string[],
	_options: RunCommandOptions,
): Promise<void> {
	if (command.length === 0) {
		console.error(chalk.red("Error: No command specified"));
		console.error(chalk.gray("Usage: picovault run -- <command>"));
		process.exit(1);
	}

	const spinner = ora("Fetching secrets...").start();

	try {
		let session = await getActiveSession();

		if (!session) {
			spinner.fail("No active session found");
			console.error(
				chalk.yellow("\nPlease run 'picovault login' first to authenticate"),
			);
			process.exit(1);
		}

		try {
			session = await ensureValidToken(session);
		} catch (error) {
			spinner.fail("Failed to refresh access token");
			console.error(
				chalk.yellow(
					"\nYour session has expired. Please run 'picovault login' again",
				),
			);
			if (error instanceof Error) {
				console.error(chalk.red(`Error: ${error.message}`));
			}
			process.exit(1);
		}

		const config = await loadConfig();

		const apiClient = new ApiClient(session.instanceUrl);

		let secrets: Secret[];

		try {
			secrets = await apiClient.fetchSecrets(session.oauth.accessToken, {
				projectId: config?.projectId,
				organisationSlug: config?.organisationSlug,
			});

			spinner.succeed(`Fetched ${secrets.length} secrets`);
		} catch (error) {
			spinner.fail("Failed to fetch secrets");

			if (error instanceof Error) {
				console.error(chalk.red(`\nError: ${error.message}`));
			}

			process.exit(1);
		}

		const enhancedEnv = prepareEnvironment(secrets);

		console.log(chalk.gray(`\nRunning: ${command.join(" ")}`));
		console.log(
			chalk.gray(`Injected ${secrets.length} environment variables\n`),
		);

		const exitCode = await executeCommand(command, enhancedEnv);

		process.exit(exitCode);
	} catch (error) {
		spinner.fail("Command execution failed");

		if (error instanceof Error) {
			console.error(chalk.red(`\nError: ${error.message}`));
		} else {
			console.error(chalk.red("\nAn unexpected error occurred"));
		}

		process.exit(1);
	}
}
