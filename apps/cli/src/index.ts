#!/usr/bin/env bun
import chalk from "chalk";
import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { runCommand } from "./commands/run";

const program = new Command();

program
	.name("picovault")
	.description("PicoVault CLI - Manage secrets for your applications")
	.version("0.1.0");

program
	.command("login")
	.description("Authenticate with a PicoVault instance")
	.option("--instance <url>", "PicoVault instance URL")
	.action(async (options) => {
		await loginCommand(options);
	});

program
	.command("logout")
	.description("Logout from PicoVault instance")
	.option("--instance <url>", "Logout from specific instance")
	.option("--all", "Logout from all instances")
	.action(async (options) => {
		await logoutCommand(options);
	});

program
	.command("run")
	.description("Run a command with injected secrets")
	.allowUnknownOption(true)
	.allowExcessArguments(true)
	.action(async (options, _command) => {
		// Get all arguments after 'run' command
		const dashDashIndex = process.argv.indexOf("--");
		if (dashDashIndex === -1) {
			console.error(chalk.red("Error: No command specified"));
			console.error(chalk.gray("Usage: picovault run -- <command>"));
			process.exit(1);
		}

		const commandArgs = process.argv.slice(dashDashIndex + 1);
		await runCommand(commandArgs, options);
	});

program.addHelpText(
	"after",
	`
${chalk.gray("Examples:")}
  $ picovault login --instance https://vault.example.com
  $ picovault logout
  $ picovault logout --all
  $ picovault run -- npm start
  $ picovault run -- ./deploy.sh

${chalk.gray("Configuration:")}
  Create a picovault.json file in your project root:
  {
    "defaultInstance": "https://vault.example.com",
    "project": "my-project",
    "environment": "development"
  }
`,
);

program.parse();
