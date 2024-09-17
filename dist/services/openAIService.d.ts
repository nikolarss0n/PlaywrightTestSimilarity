import type { Config } from "../config";
import type { Logger } from "../utils/logger";
export interface EvaluationReport {
    "Test 1": {
        Name: string;
        Steps: string[];
    };
    "Test 2": {
        Name: string;
        Steps: string[];
    };
    Similarity: number;
    "Merge Suggestion": string;
    "Matched Steps": [number, number][];
}
export declare class OpenAIService {
    private openai;
    private readonly logger;
    private readonly similarityThreshold;
    constructor(config: Config, logger: Logger);
    private initializeOpenAI;
    evaluateAndReport(test1: [string, string[]], test2: [string, string[]], similarityPercentage: number, matchedSteps: [number, number][]): Promise<EvaluationReport>;
    generateMergeSuggestion(test1Steps: string[], test2Steps: string[], similarity: number, matchedSteps: [number, number][]): Promise<string>;
    private createPrompt;
    private processMergeSuggestion;
}
