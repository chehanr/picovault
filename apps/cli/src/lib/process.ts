import { $ } from "execa";

export async function executeCommand(
	command: string[],
	env: NodeJS.ProcessEnv,
): Promise<number> {
	const subprocess = $({
		env,
		stdio: "inherit",
	});

	const result = await subprocess`${command}`;

	return result.exitCode || 0;
}
