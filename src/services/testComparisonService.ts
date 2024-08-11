import type { Test } from "../types";
import type { OpenAIService, EvaluationReport } from "./openAIService";
import type { Logger } from "../utils/logger";

export class TestComparisonService {
	private readonly openAIService: OpenAIService;
	private readonly logger: Logger;

	constructor(openAIService: OpenAIService, logger: Logger) {
		this.openAIService = openAIService;
		this.logger = logger;
	}

	public async compareTests(tests: Test[]): Promise<EvaluationReport[]> {
		const results: EvaluationReport[] = [];

		for (let i = 0; i < tests.length; i++) {
			for (let j = i + 1; j < tests.length; j++) {
				const test1 = tests[i];
				const test2 = tests[j];

				const filteredSteps1 = this.filterAndGroupSteps(test1.testSteps);
				const filteredSteps2 = this.filterAndGroupSteps(test2.testSteps);

				const { similarity, matchedSteps } = this.compareTestSteps(
					filteredSteps1,
					filteredSteps2,
				);

				this.logger.info(
					`Similarity between "${test1.testId}" and "${test2.testId}": ${similarity}%`,
				);

				const report = await this.openAIService.evaluateAndReport(
					[test1.testId, filteredSteps1],
					[test2.testId, filteredSteps2],
					similarity,
					matchedSteps,
				);

				results.push(report);
			}
		}

		return results;
	}

	private filterAndGroupSteps(steps: string[]): string[] {
		const filteredSteps: string[] = [];
		let currentAction: string | null = null;
		let retryCount = 0;

		for (const step of steps) {
			if (this.isNavigation(step)) {
				this.finalizeCurrentAction(filteredSteps, currentAction);
				currentAction = this.extractNavigationInfo(step);
			} else if (this.isInteraction(step)) {
				const newAction = this.extractInteractionInfo(step);
				if (currentAction?.startsWith("Interaction:")) {
					currentAction += `, ${newAction}`;
				} else {
					this.finalizeCurrentAction(filteredSteps, currentAction);
					currentAction = `Interaction: ${newAction}`;
				}
			} else if (this.isRetryAttempt(step)) {
				retryCount++;
				if (retryCount === 3) {
					// Arbitrary threshold, adjust as needed
					this.finalizeCurrentAction(filteredSteps, `Retry: ${currentAction}`);
					currentAction = null;
					retryCount = 0;
				}
			} else if (this.isApiCall(step)) {
				this.finalizeCurrentAction(filteredSteps, currentAction);
				currentAction = this.extractApiCallInfo(step);
			}
		}

		this.finalizeCurrentAction(filteredSteps, currentAction);
		return filteredSteps;
	}

	private finalizeCurrentAction(
		filteredSteps: string[],
		currentAction: string | null,
	) {
		if (currentAction) {
			filteredSteps.push(currentAction);
		}
	}

	private isNavigation(step: string): boolean {
		return step.includes("navigating to") || step.includes("navigated to");
	}

	private extractNavigationInfo(step: string): string {
		const match = step.match(/navigat(?:ing|ed) to "([^"]+)"/);
		return match ? `Navigate to ${match[1]}` : step;
	}

	private isInteraction(step: string): boolean {
		return (
			step.includes("locator.") ||
			step.includes("page.") ||
			step.includes("getBy")
		);
	}

	private extractInteractionInfo(step: string): string {
		const action = this.getInteractionType(step);
		const target = this.extractInteractionTarget(step);
		return `${action} ${target}`;
	}

	private getInteractionType(step: string): string {
		if (step.includes("fill")) return "Fill";
		if (step.includes("click")) return "Click";
		if (step.includes("type")) return "Type";
		if (step.includes("press")) return "Press";
		if (step.includes("select")) return "Select";
		if (step.includes("check")) return "Check";
		if (step.includes("uncheck")) return "Uncheck";
		if (step.includes("setInputFiles")) return "Upload";
		if (step.includes("selectOption")) return "Select Option";
		if (step.includes("hover")) return "Hover";
		if (step.includes("focus")) return "Focus";
		if (step.includes("drag")) return "Drag";
		if (step.includes("drop")) return "Drop";
		if (step.includes("dblclick")) return "Double Click";
		if (step.includes("tap")) return "Tap";
		if (step.includes("expect")) return "Expect";
		if (step.includes("toHaveText")) return "Validate Text";
		if (step.includes("toBeVisible")) return "Validate Visibility";
		if (step.includes("toBeEnabled")) return "Validate Enabled State";
		if (step.includes("toHaveAttribute")) return "Validate Attribute";
		if (step.includes("toHaveValue")) return "Validate Value";
		if (step.includes("toHaveCount")) return "Validate Count";
		if (step.includes("toContainText")) return "Validate Contained Text";
		if (step.includes("toHaveClass")) return "Validate Class";
		if (step.includes("toBeChecked")) return "Validate Checked State";
		if (step.includes("waitFor")) return "Wait";
		if (step.includes("screenshot")) return "Take Screenshot";
		return "Interact with";
	}

	private extractInteractionTarget(step: string): string {
		const roleMatch = step.match(
			/getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'\s*}/,
		);
		if (roleMatch) {
			return `${roleMatch[1]} "${roleMatch[2]}"`;
		}

		const simpleMatch = step.match(
			/(?:locator|getByText|page\.(?:fill|click|type|press|select))\('([^']+)'/,
		);
		if (simpleMatch) {
			return simpleMatch[1];
		}

		const resolvedMatch = step.match(/locator resolved to <([^>]+)>/);
		if (resolvedMatch) {
			const elementType = resolvedMatch[1].split(" ")[0];
			return `${elementType} element`;
		}

		return "unknown element";
	}

	private isRetryAttempt(step: string): boolean {
		return step.includes("retrying") && step.includes("attempt #");
	}

	private isApiCall(step: string): boolean {
		return (
			step.includes("api") &&
			(step.includes("started") || step.includes("succeeded"))
		);
	}

	private extractApiCallInfo(step: string): string {
		const match = step.match(/(\w+)\s+(started|succeeded)/);
		return match ? `API: ${match[1]} ${match[2]}` : step;
	}

	private compareTestSteps(
		steps1: string[],
		steps2: string[],
	): { similarity: number; matchedSteps: [number, number][] } {
		const matchedSteps: [number, number][] = [];
		const dp: number[][] = Array(steps1.length + 1)
			.fill(null)
			.map(() => Array(steps2.length + 1).fill(0));

		for (let i = 1; i <= steps1.length; i++) {
			for (let j = 1; j <= steps2.length; j++) {
				if (this.areStepsSimilar(steps1[i - 1], steps2[j - 1])) {
					dp[i][j] = dp[i - 1][j - 1] + 1;
				} else {
					dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
				}
			}
		}

		let i = steps1.length;
		let j = steps2.length;
		while (i > 0 && j > 0) {
			if (this.areStepsSimilar(steps1[i - 1], steps2[j - 1])) {
				matchedSteps.unshift([i - 1, j - 1]);
				i--;
				j--;
			} else if (dp[i - 1][j] > dp[i][j - 1]) {
				i--;
			} else {
				j--;
			}
		}

		const longestCommonSubsequence = matchedSteps.length;
		const totalSteps = Math.max(steps1.length, steps2.length);
		const similarity = (longestCommonSubsequence / totalSteps) * 100;

		return {
			similarity: Number(similarity.toFixed(2)),
			matchedSteps,
		};
	}

	private areStepsSimilar(step1: string, step2: string): boolean {
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

		// Compare hostname and pathname
		if (url1.hostname !== url2.hostname || url1.pathname !== url2.pathname) {
			return false;
		}

		// Compare query parameters, ignoring certain dynamic ones
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
