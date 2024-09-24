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
		const apiCallsBuffer: string[] = [];

		for (const step of steps) {
			if (this.isNavigation(step)) {
				this.finalizeCurrentAction(
					filteredSteps,
					currentAction,
					apiCallsBuffer,
				);
				currentAction = this.extractNavigationInfo(step);
			} else if (this.isInteraction(step)) {
				const newAction = this.extractInteractionInfo(step);
				if (currentAction?.startsWith("Interaction:")) {
					// Instead of appending to the current action, finalize it and start a new one
					this.finalizeCurrentAction(
						filteredSteps,
						currentAction,
						apiCallsBuffer,
					);
					currentAction = `Interaction: ${newAction}`;
				} else {
					this.finalizeCurrentAction(
						filteredSteps,
						currentAction,
						apiCallsBuffer,
					);
					currentAction = `Interaction: ${newAction}`;
				}
			} else if (this.isRetryAttempt(step)) {
				retryCount++;
				if (retryCount === 3) {
					this.finalizeCurrentAction(
						filteredSteps,
						`Retry: ${currentAction}`,
						apiCallsBuffer,
					);
					currentAction = null;
					retryCount = 0;
				}
			} else if (this.isApiCall(step)) {
				apiCallsBuffer.push(this.extractApiCallInfo(step));
			}
		}

		this.finalizeCurrentAction(filteredSteps, currentAction, apiCallsBuffer);
		return filteredSteps;
	}

	private finalizeCurrentAction(
		filteredSteps: string[],
		currentAction: string | null,
		apiCallsBuffer: string[],
	) {
		let updatedAction: string | null = currentAction;

		if (updatedAction) {
			// Remove "Interaction: " prefix if it exists
			updatedAction = updatedAction.replace(/^Interaction: /, "");

			if (apiCallsBuffer.length > 0) {
				const apiSummary = this.summarizeApiCalls(apiCallsBuffer);
				updatedAction += ` (${apiSummary})`;
				apiCallsBuffer.length = 0;
			}
			filteredSteps.push(updatedAction);
		} else if (apiCallsBuffer.length > 0) {
			filteredSteps.push(
				`API Calls: ${this.summarizeApiCalls(apiCallsBuffer)}`,
			);
			apiCallsBuffer.length = 0;
		}
	}

	private summarizeApiCalls(apiCalls: string[]): string {
		const summary: { [key: string]: { started: number; succeeded: number } } =
			{};
		for (const call of apiCalls) {
			const [action, status] = call.split(" ");
			if (!summary[action]) {
				summary[action] = { started: 0, succeeded: 0 };
			}
			if (status === "started") {
				summary[action].started++;
			} else if (status === "succeeded") {
				summary[action].succeeded++;
			}
		}
		return Object.entries(summary)
			.map(([action, counts]) => {
				const startedCount =
					counts.started > 0 ? `${counts.started} started` : "";
				const succeededCount =
					counts.succeeded > 0 ? `${counts.succeeded} succeeded` : "";
				const countStr = [startedCount, succeededCount]
					.filter(Boolean)
					.join(", ");
				return `${action}: ${countStr}`;
			})
			.join(", ");
	}

	private isApiCall(step: string): boolean {
		return (
			step.startsWith("pw:api") &&
			(step.includes("started") || step.includes("succeeded"))
		);
	}

	private extractApiCallInfo(step: string): string {
		const match = step.match(/pw:api [=><]+ ([^ ]+) (started|succeeded)/);
		return match ? `${match[1]} ${match[2]}` : step;
	}

	private isNavigation(step: string): boolean {
		return step.startsWith("Navigate to");
	}

	private extractNavigationInfo(step: string): string {
		return step;
	}

	private isInteraction(step: string): boolean {
		return (
			step.includes("locator.") ||
			step.includes("page.") ||
			step.includes("getBy") ||
			step.includes("pw:api")
		);
	}

	private extractInteractionInfo(step: string): string {
		const action = this.getInteractionType(step);
		const target = this.extractInteractionTarget(step);
		return `${action} ${target}`; // Removed "Interaction: " prefix
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
		if (step.includes("waitFor")) return "Wait for";
		if (step.includes("screenshot")) return "Take Screenshot";
		if (step.includes("setViewportSize")) return "Set Viewport Size";
		if (step.includes("goto")) return "Navigate";
		return "Interact with";
	}

	private extractInteractionTarget(step: string): string {
		const apiMatch = step.match(/pw:api ([^(]+)\(([^)]+)\)/);
		if (apiMatch) {
			return `element (${apiMatch[1]}${apiMatch[2]})`;
		}

		const locatorMatch = step.match(/locator\.(\w+) (\w+)/);
		if (locatorMatch) {
			const [, action, status] = locatorMatch;
			if (action === "_expect") {
				const expectationMatch = step.match(/expect\(([^)]+)\)\.([^(]+)\(/);
				if (expectationMatch) {
					const [, target, expectation] = expectationMatch;
					return `${target} to ${expectation} (${status})`;
				}
			}
			return `element (${locatorMatch[0]})`;
		}

		const waitForMatch = step.match(/page\.waitForResponse (\w+)/);
		if (waitForMatch) {
			return `element (${waitForMatch[0]})`;
		}

		const expectTimeoutMatch = step.match(
			/locator\._expect with timeout (\d+)ms/,
		);
		if (expectTimeoutMatch) {
			return `element (locator._expect with timeout ${expectTimeoutMatch[1]}ms)`;
		}

		// If no specific pattern matches, return the full step
		return `element (${step})`;
	}

	private isRetryAttempt(step: string): boolean {
		return step.includes("retrying") && step.includes("attempt #");
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
