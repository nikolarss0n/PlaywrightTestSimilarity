#!/usr/bin/env node
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { main } from "../dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
	await readFile(new URL("../package.json", import.meta.url)),
);

const program = new Command();

program
	.version(packageJson.version)
	.description("Compare and analyze e2e tests")
	.argument("<logfile>", "Path to the log file")
	.option("-o, --output <file>", "Output file name", "report.html")
	.action((logfile, options) => {
		const outputPath = resolve(options.output);
		main(logfile, outputPath)
			.then(() => {
				// The main function now logs the output path, so we don't need to do it here
			})
			.catch(console.error);
	});

program.parse(process.argv);
