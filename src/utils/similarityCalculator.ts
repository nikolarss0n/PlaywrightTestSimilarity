import type { StepSummarizer } from "./stepSummarizer";
import type { Logger } from "./logger";

export class SimilarityCalculator {
	private readonly logger: Logger;
	private readonly stepSummarizer: StepSummarizer;

	constructor(logger: Logger, stepSummarizer: StepSummarizer) {
		this.logger = logger;
		this.stepSummarizer = stepSummarizer;
	}

	public calculateSimilarity(
		test1Steps: string[],
		test2Steps: string[],
	): number {
		const summarizedTest1Steps = this.stepSummarizer.summarize(test1Steps);
		const summarizedTest2Steps = this.stepSummarizer.summarize(test2Steps);

		this.logger.debug(
			`Summarized Test 1 Steps: ${summarizedTest1Steps.join(", ")}`,
		);
		this.logger.debug(
			`Summarized Test 2 Steps: ${summarizedTest2Steps.join(", ")}`,
		);

		const matchCount = this.findFirstMatchIndex(
			summarizedTest1Steps,
			summarizedTest2Steps,
		);
		const similarityPercentage =
			(matchCount / summarizedTest1Steps.length) * 100;

		return Number(similarityPercentage.toFixed(2));
	}

	private findFirstMatchIndex(
		smallerSteps: string[],
		largerSteps: string[],
	): number {
		let matchCount = 0;
		const usedIndices = new Set<number>();

		for (const smallStep of smallerSteps) {
			for (let i = 0; i < largerSteps.length; i++) {
				if (smallStep === largerSteps[i] && !usedIndices.has(i)) {
					matchCount++;
					usedIndices.add(i);
					break;
				}
			}
		}

		return matchCount;
	}
}
