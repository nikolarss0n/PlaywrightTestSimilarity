export declare function main(logFilePath: string, outputPath?: string): Promise<void>;
export { parseRawFile } from "./parsers/logParser";
export { TestComparisonService } from "./services/testComparisonService";
export { OpenAIService } from "./services/openAIService";
export { generateHtmlReport } from "./reporters/htmlReporter";
export { Logger } from "./utils/logger";
export { config } from "./config";
