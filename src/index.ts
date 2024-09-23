import { parseRawFile } from "./parsers/logParser.js";
import { TestComparisonService } from "./services/testComparisonService.js";
import { OpenAIService } from "./services/openAIService.js";
import { generateHtmlReport } from "./reporters/htmlReporter.js";
import { Logger } from "./utils/logger.js";
import { config } from "./config.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function main(logFilePath: string, outputPath = "report.html") {
	const logger = new Logger();
	try {
		const tests = parseRawFile(logFilePath);
		logger.info(`Parsed ${tests.length} tests from the log file.`);
		const filteredTests = tests.filter((test) => test.testSteps.length >= 5);
		logger.info(
			`Filtered down to ${filteredTests.length} tests with 5 or more steps.`,
		);
		const openAIService = new OpenAIService(config, logger);
		const comparisonService = new TestComparisonService(openAIService, logger);
		const results = await comparisonService.compareTests(filteredTests);
		logger.info(`Completed ${results.length} test comparisons.`);
		const htmlReport = generateHtmlReport(results);
		// Ensure the output directory exists
		const outputDir = path.dirname(outputPath);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
		// Write the report
		const absoluteOutputPath = path.resolve(outputPath);
		fs.writeFileSync(absoluteOutputPath, htmlReport);
		console.log(`HTML report generated successfully at: ${absoluteOutputPath}`);
		logger.info(`HTML report generated successfully at: ${absoluteOutputPath}`);
	} catch (error) {
		logger.error(`An error occurred: ${(error as Error).message}`);
		throw error;
	}
}

export { parseRawFile } from "./parsers/logParser.js";
export { TestComparisonService } from "./services/testComparisonService.js";
export { OpenAIService } from "./services/openAIService.js";
export { generateHtmlReport } from "./reporters/htmlReporter.js";
export { Logger } from "./utils/logger.js";
export { config } from "./config.js";

// This part is only for direct execution of this file
if (import.meta.url === `file://${__filename}`) {
	const [, , logFilePath, outputFile] = process.argv;
	if (!logFilePath) {
		console.error("Please provide a path to the log file.");
		process.exit(1);
	}
	main(logFilePath, outputFile).catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
