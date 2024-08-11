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
	): {
		similarity: number;
		matchedSteps: [number, number][];
		categorizedSimilarity: CategorizedSimilarity;
	} {
		const summarizedTest1Steps = this.stepSummarizer.summarize(test1Steps);
		const summarizedTest2Steps = this.stepSummarizer.summarize(test2Steps);

		this.logger.debug(
			`Summarized Test 1 Steps: ${summarizedTest1Steps.join(", ")}`,
		);
		this.logger.debug(
			`Summarized Test 2 Steps: ${summarizedTest2Steps.join(", ")}`,
		);

		const { matchCount, matchedSteps, categorizedSimilarity } =
			this.findLongestCommonSubsequences(
				summarizedTest1Steps,
				summarizedTest2Steps,
			);

		const totalSteps = Math.max(
			summarizedTest1Steps.length,
			summarizedTest2Steps.length,
		);
		const similarityPercentage = (matchCount / totalSteps) * 100;

		return {
			similarity: Number(similarityPercentage.toFixed(2)),
			matchedSteps,
			categorizedSimilarity,
		};
	}

	private findLongestCommonSubsequences(
		steps1: string[],
		steps2: string[],
	): {
		matchCount: number;
		matchedSteps: [number, number][];
		categorizedSimilarity: CategorizedSimilarity;
	} {
		let matchCount = 0;
		const matchedSteps: [number, number][] = [];
		const categorizedSimilarity: CategorizedSimilarity = {
			identicalSteps: 0,
			verySimilarSteps: 0,
			divergentSteps: 0,
		};
		const m = steps1.length;
		const n = steps2.length;
		const dp: number[][] = Array(m + 1)
			.fill(0)
			.map(() => Array(n + 1).fill(0));

		// Build the dp table
		for (let i = 1; i <= m; i++) {
			for (let j = 1; j <= n; j++) {
				const similarity = this.compareSteps(steps1[i - 1], steps2[j - 1]);
				if (similarity > 0) {
					dp[i][j] = dp[i - 1][j - 1] + similarity;
				} else {
					dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
				}
			}
		}

		// Backtrack to find the matched steps
		let i = m;
		let j = n;
		while (i > 0 && j > 0) {
			const similarity = this.compareSteps(steps1[i - 1], steps2[j - 1]);
			if (similarity > 0) {
				matchedSteps.unshift([i - 1, j - 1]);
				matchCount++;
				if (similarity === 1) {
					categorizedSimilarity.identicalSteps++;
				} else {
					categorizedSimilarity.verySimilarSteps++;
				}
				i--;
				j--;
			} else if (dp[i - 1][j] > dp[i][j - 1]) {
				i--;
			} else {
				j--;
			}
		}

		categorizedSimilarity.divergentSteps = m + n - 2 * matchCount;

		return { matchCount, matchedSteps, categorizedSimilarity };
	}

	private compareSteps(step1: string, step2: string): number {
		if (this.areStepsIdentical(step1, step2)) {
			return 1;
		}
		if (this.areStepsVerySimilar(step1, step2)) {
			return 0.5;
		}
		return 0;
	}

	private areStepsIdentical(step1: string, step2: string): boolean {
		return step1 === step2;
	}

	private areStepsVerySimilar(step1: string, step2: string): boolean {
		if (step1.startsWith("Navigate to") && step2.startsWith("Navigate to")) {
			return this.compareUrls(step1, step2);
		}

		const normalizedStep1 = this.normalizeStep(step1);
		const normalizedStep2 = this.normalizeStep(step2);
		return normalizedStep1 === normalizedStep2;
	}

	private compareUrls(step1: string, step2: string): boolean {
		const url1 = new URL(step1.replace("Navigate to ", ""));
		const url2 = new URL(step2.replace("Navigate to ", ""));

		if (url1.hostname !== url2.hostname || url1.pathname !== url2.pathname) {
			return false;
		}

		const ignoredParams = ["state"];
		const params1 = new URLSearchParams(url1.search);
		const params2 = new URLSearchParams(url2.search);

		if (params1.size !== params2.size) {
			return false;
		}

		for (const [key, value] of params1) {
			if (ignoredParams.includes(key)) continue;
			if (params2.get(key) !== value) {
				return false;
			}
		}

		return true;
	}

	private normalizeStep(step: string): string {
		return step
			.replace(/['"](.*?)['"]/, "X") // Replace quoted content with X
			.replace(/\d+/g, "N") // Replace numbers with N
			.replace(/\s+/g, " ") // Normalize whitespace
			.toLowerCase();
	}
}

interface CategorizedSimilarity {
	identicalSteps: number;
	verySimilarSteps: number;
	divergentSteps: number;
}
