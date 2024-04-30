#!/usr/bin/env node
import fs from 'fs';
import calculateSimilarity from './dist/calculate-similarity.js';

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log("Usage: pw-similarity [options]");
        console.log("Options:");
        console.log("  --help                Display this help message");
        console.log("  --log <path_to_log>   Specify the path to the playwright-debug.log file");
        return;
    }

    let logFilePath = "playwright-debug.log";
    const logIndex = args.indexOf('--log');
    if (logIndex !== -1 && args[logIndex + 1]) {
        logFilePath = args[logIndex + 1];
    }

    if (!fs.existsSync(logFilePath)) {
        console.error(`Log file not found at ${logFilePath}`);
        return;
    }

    calculateSimilarity(logFilePath)
        .then(() => console.log("Similarity analysis completed."))
        .catch(error => console.error("An error occurred:", error));
}

main();
