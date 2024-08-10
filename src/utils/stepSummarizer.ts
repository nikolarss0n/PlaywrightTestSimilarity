import { Logger } from "./logger";

export class StepSummarizer {
	private readonly keyPhrases: string[];
	private readonly logger: Logger;

	constructor(keyPhrases?: string[], logger?: Logger) {
		this.keyPhrases = (
			keyPhrases || [
				"navigating to",
				"fill",
				"waiting for",
				"click",
				"navigated to",
			]
		).map((phrase) => phrase.toLowerCase());
		this.logger = logger || new Logger();
	}

	public summarize(steps: string[]): string[] {
		return steps
			.map((step) => this.extractAction(step))
			.filter(
				(step): step is string => step !== null && typeof step === "string",
			)
			.filter((step) => this.shouldKeepStep(step));
	}

	private extractAction(step: string): string | null {
		const lowercaseStep = step.toLowerCase();
		const actionIndex = lowercaseStep.indexOf("pw:api");

		if (actionIndex === -1) {
			this.logger.error(`"pw:api" not found in step: ${step}`);
			return null;
		}

		const startIndex = step.indexOf(" ", actionIndex + "pw:api".length) + 1;
		if (startIndex === 0) {
			this.logger.error(`Action not found after "pw:api" in step: ${step}`);
			return null;
		}

		const summarizedStep = step.substring(startIndex).trim();
		this.logger.debug(`Summarized Step: ${summarizedStep}`);
		return summarizedStep;
	}

	private shouldKeepStep(step: string | null): boolean {
		if (step === null) return false;

		const shouldKeep = this.keyPhrases.some((phrase) =>
			step.toLowerCase().includes(phrase),
		);
		this.logger.debug(`Step "${step}" kept: ${shouldKeep}`);
		return shouldKeep;
	}
}

export function summarizeSteps(steps: string[]): string[] {
	const summarizer = new StepSummarizer();
	return summarizer.summarize(steps);
}
