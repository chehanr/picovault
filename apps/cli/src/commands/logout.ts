import chalk from "chalk";
import { z } from "zod";
import {
	clearAllSessions,
	getActiveSession,
	loadSessions,
	removeSession,
} from "../lib/storage";
import { normaliseUrl } from "../lib/utils";

const logoutOptionsSchema = z.object({
	instance: z.string().optional(),
	all: z.boolean().optional(),
});

export async function logoutCommand(options: unknown): Promise<void> {
	try {
		const validatedOptions = logoutOptionsSchema.parse(options);

		if (validatedOptions.all) {
			await clearAllSessions();
			console.log(chalk.green("Logged out from all instances"));
			return;
		}

		if (validatedOptions.instance) {
			const normalisedUrl = normaliseUrl(validatedOptions.instance);
			const sessions = await loadSessions();
			const session = sessions.sessions.find(
				(s) => s.instanceUrl === normalisedUrl,
			);

			if (!session) {
				console.log(chalk.yellow(`Not logged in to ${normalisedUrl}`));
				return;
			}

			await removeSession(normalisedUrl);
			console.log(chalk.green(`Logged out from ${normalisedUrl}`));
			return;
		}

		const activeSession = await getActiveSession();
		if (!activeSession) {
			console.log(chalk.yellow("Not logged in to any instance"));
			return;
		}

		await removeSession(activeSession.instanceUrl);
		console.log(chalk.green(`Logged out from ${activeSession.instanceUrl}`));
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error(chalk.red("Invalid options:"), error.errors);
			process.exit(1);
		}
		console.error(chalk.red("Logout failed:"), (error as Error).message);
		process.exit(1);
	}
}
