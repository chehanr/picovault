import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";
import { type PicoVaultConfig, picoVaultConfigSchema } from "../schema/config";

const explorer = cosmiconfig("picovault", {
	searchPlaces: [
		"picovault.json",
		"picovault.config.json",
		".picovaultrc",
		".picovaultrc.json",
		".picovaultrc.js",
		".picovaultrc.cjs",
		"package.json",
	],
	packageProp: "picovault",
	stopDir: process.env.HOME,
});

export async function loadConfig(): Promise<PicoVaultConfig | null> {
	try {
		const result = await explorer.search();

		if (!result || result.isEmpty) {
			return null;
		}

		const config = picoVaultConfigSchema.parse(result.config);
		return config;
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Invalid configuration file:", error.errors);
			throw new Error("Configuration file validation failed");
		}
		throw error;
	}
}
