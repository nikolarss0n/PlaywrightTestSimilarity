import * as fs from "node:fs";
import type { Test } from "../types";

interface RegexPatterns {
	cucumberTitle: RegExp;
	testTitle: RegExp;
	cucumberAction: RegExp;
	playwrightAction: RegExp;
}

export class LogParser {
	private readonly patterns: RegexPatterns = {
		cucumberTitle: /^(?:\.|)Starting Scenario: (.*)/,
		testTitle:
			/^\s*✓\s+\d+\s+([\w/.-]+:\d+:\d+)\s+›\s+(.*?)(?:\s+\(([\d.]+)ms\))?$/,
		cucumberAction: /(?:pw:api|Z pw:api) .*/,
		playwrightAction: /pw:api.*?=>\s*(.*?)\s*[\u001b\[\d;]+m\+/,
	};

	constructor(private readonly filePath: string) {}

	public parse(): Test[] {
		const fileContent = this.readFile();
		const lines = this.splitLines(fileContent);
		return this.parseLines(lines);
	}

	private readFile(): string {
		try {
			return fs.readFileSync(this.filePath, "utf-8").replace(/\r\n/g, "\n");
		} catch (error) {
			throw new Error(
				`Failed to read file: ${this.filePath}. ${(error as Error).message}`,
			);
		}
	}

	private splitLines(content: string): string[] {
		return content.split("\n");
	}

	private parseLines(lines: string[]): Test[] {
		const tests: Test[] = [];
		let currentTest: Test | null = null;
		let isCucumberTest = false;

		for (const line of lines) {
			const strippedLine = this.stripTimestamp(line.trim());

			if (this.patterns.cucumberTitle.test(strippedLine)) {
				this.finalizeCucumberTest(tests, currentTest);
				currentTest = this.createCucumberTest(strippedLine);
				isCucumberTest = true;
			} else if (
				isCucumberTest &&
				this.patterns.cucumberAction.test(strippedLine)
			) {
				this.addStepToTest(currentTest, strippedLine);
			} else if (this.patterns.testTitle.test(strippedLine)) {
				currentTest = this.createPlaywrightTest(strippedLine);
				tests.push(currentTest);
				isCucumberTest = false;
			} else if (this.patterns.playwrightAction.test(strippedLine)) {
				this.addStepToTest(currentTest, strippedLine);
			}
		}

		this.finalizeCucumberTest(tests, currentTest);
		return tests;
	}

	private stripTimestamp(line: string): string {
		// Remove any leading non-alphanumeric characters, then the timestamp
		return line
			.replace(/^[^a-zA-Z0-9]*/, "")
			.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s+/, "");
	}

	private createCucumberTest(line: string): Test {
		const match = line.match(this.patterns.cucumberTitle);
		return {
			testId: match?.[1] ?? "",
			testSteps: [],
		};
	}

	private createPlaywrightTest(line: string): Test {
		return { testId: line, testSteps: [] };
	}

	private addStepToTest(test: Test | null, step: string): void {
		if (test) {
			test.testSteps.push(step);
		}
	}

	private finalizeCucumberTest(tests: Test[], currentTest: Test | null): void {
		if (currentTest && currentTest.testSteps.length > 0) {
			tests.push(currentTest);
		}
	}
}

export function parseRawFile(filePath: string): Test[] {
	const parser = new LogParser(filePath);
	return parser.parse();
}
