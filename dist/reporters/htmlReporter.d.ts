import type { EvaluationReport } from "../services/openAIService";
export declare class HtmlReporter {
    private readonly cssStyles;
    private readonly scriptContent;
    generateHtmlReport(reportData: EvaluationReport[]): string;
}
export declare function generateHtmlReport(reportData: EvaluationReport[]): string;
