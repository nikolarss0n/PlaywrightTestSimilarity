import type { Test } from "../types";
import type { OpenAIService, EvaluationReport } from "./openAIService";
import type { Logger } from "../utils/logger";
export declare class TestComparisonService {
    private readonly openAIService;
    private readonly logger;
    constructor(openAIService: OpenAIService, logger: Logger);
    compareTests(tests: Test[]): Promise<EvaluationReport[]>;
    private filterAndGroupSteps;
    private finalizeCurrentAction;
    private summarizeApiCalls;
    private isApiCall;
    private extractApiCallInfo;
    private isNavigation;
    private extractNavigationInfo;
    private isInteraction;
    private extractInteractionInfo;
    private getInteractionType;
    private extractInteractionTarget;
    private isRetryAttempt;
    private compareTestSteps;
    private areStepsSimilar;
    private compareUrls;
    private normalizeStep;
}
