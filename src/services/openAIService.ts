import OpenAI from "openai";
import type { Config } from "../config";
import type { Logger } from "../utils/logger";

export interface EvaluationReport {
	"Test 1": { Name: string; Steps: string[] };
	"Test 2": { Name: string; Steps: string[] };
	Similarity: number;
	"Merge Suggestion": string;
	"Matched Steps": [number, number][];
}

export class OpenAIService {
	private openai: OpenAI | null = null;
	private readonly logger: Logger;
	private readonly similarityThreshold: number;

	constructor(config: Config, logger: Logger) {
		this.logger = logger;
		this.similarityThreshold = config.similarityThreshold;
		this.initializeOpenAI(config.openAIApiKey);
	}

	private initializeOpenAI(apiKey: string | undefined): void {
		try {
			if (!apiKey) {
				throw new Error("OpenAI API key is not provided in the configuration.");
			}
			this.openai = new OpenAI({ apiKey });
			this.logger.info("OpenAI client initialized successfully.");
		} catch (error) {
			this.logger.error(
				`Failed to initialize OpenAI client: ${(error as Error).message}`,
			);
			this.openai = null;
		}
	}

	public async evaluateAndReport(
		test1: [string, string[]],
		test2: [string, string[]],
		similarityPercentage: number,
		matchedSteps: [number, number][],
	): Promise<EvaluationReport> {
		const [test1Name, test1Steps] = test1;
		const [test2Name, test2Steps] = test2;

		this.logger.debug("Starting evaluation and report generation");

		const mergeSuggestion = await this.generateMergeSuggestion(
			test1Steps,
			test2Steps,
			similarityPercentage,
			matchedSteps,
		);

		return {
			"Test 1": {
				Name: test1Name,
				Steps: test1Steps,
			},
			"Test 2": {
				Name: test2Name,
				Steps: test2Steps,
			},
			Similarity: similarityPercentage,
			"Merge Suggestion": mergeSuggestion,
			"Matched Steps": matchedSteps,
		};
	}

	public async generateMergeSuggestion(
		test1Steps: string[],
		test2Steps: string[],
		similarity: number,
		matchedSteps: [number, number][],
	): Promise<string> {
		if (similarity <= this.similarityThreshold) {
			return `No merge suggested due to low similarity (${similarity}%)`;
		}

		if (!this.openai) {
			return "OpenAI client is not initialized. Cannot generate merge suggestion.";
		}

		const prompt = this.createPrompt(test1Steps, test2Steps, matchedSteps);

		try {
			const response = await this.openai.completions.create({
				model: "gpt-3.5-turbo-instruct",
				prompt: prompt,
				max_tokens: 700,
			});

			return this.processMergeSuggestion(response.choices[0].text.trim());
		} catch (error) {
			this.logger.error(
				`Error generating merge suggestion: ${(error as Error).message}`,
			);
			return `Failed to generate merge suggestion: ${(error as Error).message}`;
		}
	}

	private createPrompt(
		test1Steps: string[],
		test2Steps: string[],
		matchedSteps: [number, number][],
	): string {
		const matchedStepsDescription = matchedSteps
			.map(
				([i, j]) => `Step ${i + 1} of Test 1 matches Step ${j + 1} of Test 2`,
			)
			.join("\n");

		return `Can these two test cases be merged? If yes, suggest how. Consider the matched steps in your suggestion.

Test 1: ${test1Steps.join(", ")}
Test 2: ${test2Steps.join(", ")}

Matched Steps:
${matchedStepsDescription}

Provide a step-by-step merge suggestion, preserving the order of steps where possible and including unique steps from both tests.`;
	}

	private processMergeSuggestion(suggestion: string): string {
		if (!suggestion.toLowerCase().includes("yes")) {
			return suggestion;
		}

		const suggestedSteps = suggestion.split("\n");
		return suggestedSteps
			.map((step) => step.trim())
			.filter((step) => step.length > 0)
			.map((step) => {
				if (step.startsWith("-")) return step;
				return `- ${step.replace(/^\d+\.\s*/, "")}`;
			})
			.join("\n");
	}
}
