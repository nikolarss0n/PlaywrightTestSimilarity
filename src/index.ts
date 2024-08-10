import { parseRawFile } from "./parsers/logParser";
import { TestComparisonService } from "./services/testComparisonService";
import { SimilarityCalculator } from "./utils/similarityCalculator";
import { StepSummarizer } from "./utils/stepSummarizer";
import { OpenAIService } from "./services/openAIService";
import { generateHtmlReport } from "./reporters/htmlReporter";
import { Logger } from "./utils/logger";
import { config } from "./config";
import * as fs from "node:fs";
import type { EvaluationReport } from "./services/openAIService";

async function main(logFilePath: string) {
	const logger = new Logger();

	try {
		const tests = parseRawFile(logFilePath);
		logger.info(`Parsed ${tests.length} tests from the log file.`);

		const filteredTests = tests.filter((test) => test.testSteps.length >= 5);
		logger.info(
			`Filtered down to ${filteredTests.length} tests with 5 or more steps.`,
		);

		const stepSummarizer = new StepSummarizer(undefined, logger);
		const similarityCalculator = new SimilarityCalculator(
			logger,
			stepSummarizer,
		);
		const openAIService = new OpenAIService(config, logger);
		const comparisonService = new TestComparisonService(
			similarityCalculator,
			openAIService,
			logger,
		);

		const results: EvaluationReport[] =
			await comparisonService.compareTests(filteredTests);
		logger.info(`Completed ${results.length} test comparisons.`);

		const htmlReport = generateHtmlReport(results);
		fs.writeFileSync("report.html", htmlReport);
		logger.info("HTML report generated successfully.");
	} catch (error) {
		logger.error(`An error occurred: ${(error as Error).message}`);
	}
}

main("./playwright-debug1.log").catch(console.error);
