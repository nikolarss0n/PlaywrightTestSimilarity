import { Logger } from "./logger";
export declare class StepSummarizer {
    private readonly keyPhrases;
    private readonly logger;
    constructor(keyPhrases?: string[], logger?: Logger);
    summarize(steps: string[]): string[];
    private extractAction;
    private shouldKeepStep;
}
export declare function summarizeSteps(steps: string[]): string[];
