import type { Test } from "../types";
import type { SimilarityCalculator } from "../utils/similarityCalculator";
import type { OpenAIService, EvaluationReport } from "./openAIService";
import type { Logger } from "../utils/logger";

export class TestComparisonService {
	private readonly similarityCalculator: SimilarityCalculator;
	private readonly openAIService: OpenAIService;
	private readonly logger: Logger;

	constructor(
		similarityCalculator: SimilarityCalculator,
		openAIService: OpenAIService,
		logger: Logger,
	) {
		this.similarityCalculator = similarityCalculator;
		this.openAIService = openAIService;
		this.logger = logger;
	}

	public async compareTests(tests: Test[]): Promise<EvaluationReport[]> {
		const results: EvaluationReport[] = [];

		for (let i = 0; i < tests.length; i++) {
			for (let j = i + 1; j < tests.length; j++) {
				const test1 = tests[i];
				const test2 = tests[j];

				const similarity = this.similarityCalculator.calculateSimilarity(
					test1.testSteps,
					test2.testSteps,
				);

				this.logger.info(
					`Similarity between "${test1.testId}" and "${test2.testId}": ${similarity}%`,
				);

				const report = await this.openAIService.evaluateAndReport(
					[test1.testId, test1.testSteps],
					[test2.testId, test2.testSteps],
					similarity,
				);

				results.push(report);
			}
		}

		return results;
	}
}
