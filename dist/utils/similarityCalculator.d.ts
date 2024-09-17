import type { StepSummarizer } from "./stepSummarizer";
import type { Logger } from "./logger";
export declare class SimilarityCalculator {
    private readonly logger;
    private readonly stepSummarizer;
    constructor(logger: Logger, stepSummarizer: StepSummarizer);
    calculateSimilarity(test1Steps: string[], test2Steps: string[]): {
        similarity: number;
        matchedSteps: [number, number][];
        categorizedSimilarity: CategorizedSimilarity;
    };
    private findLongestCommonSubsequences;
    private compareSteps;
    private areStepsIdentical;
    private areStepsVerySimilar;
    private compareUrls;
    private normalizeStep;
}
interface CategorizedSimilarity {
    identicalSteps: number;
    verySimilarSteps: number;
    divergentSteps: number;
}
export {};
