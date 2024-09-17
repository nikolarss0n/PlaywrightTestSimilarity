import type { Test } from "../types";
export declare class LogParser {
    private readonly filePath;
    private readonly patterns;
    constructor(filePath: string);
    parse(): Test[];
    private readFile;
    private splitLines;
    private parseLines;
    private stripTimestamp;
    private createCucumberTest;
    private createPlaywrightTest;
    private addStepToTest;
    private finalizeCucumberTest;
}
export declare function parseRawFile(filePath: string): Test[];
