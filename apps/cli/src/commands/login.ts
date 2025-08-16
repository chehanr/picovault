import chalk from "chalk";
import { z } from "zod";
import { authenticate } from "../lib/auth";
import { loadConfig } from "../lib/config";
import { normaliseUrl } from "../lib/utils";

const loginOptionsSchema = z.object({
	instance: z.string().optional(),
});

export async function loginCommand(options: unknown): Promise<void> {
	try {
		const validatedOptions = loginOptionsSchema.parse(options);

		let instanceUrl = validatedOptions.instance
			? normaliseUrl(validatedOptions.instance)
			: undefined;

		if (!instanceUrl) {
			const config = await loadConfig();
			instanceUrl = config?.defaultInstance;

			if (!instanceUrl) {
				console.error(
					chalk.red(
						"No instance URL provided. Use --instance flag or set defaultInstance in picovault.json",
					),
				);
				process.exit(1);
			}
		}

		// Validate the URL format
		try {
			new URL(instanceUrl);
		} catch {
			console.error(chalk.red(`Invalid instance URL: ${instanceUrl}`));
			console.error(
				chalk.gray(
					"Example: --instance localhost:3001 or --instance https://vault.example.com",
				),
			);
			process.exit(1);
		}

		await authenticate({ instanceUrl });
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error(chalk.red("Invalid options:"), error.cause);
			process.exit(1);
		}
		console.error(chalk.red("Login failed:"), (error as Error).message);
		process.exit(1);
	}
}
