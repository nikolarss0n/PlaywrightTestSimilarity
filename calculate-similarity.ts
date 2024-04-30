import * as fs from "node:fs";
import OpenAI from "openai";

declare global {
	namespace JSX {
		interface IntrinsicElements {
			div: Record<string, any>;
		}
	}
}

let openai: OpenAI;

try {
	const apiKey = process.env["OPENAI_API_KEY"] || null;
	openai = new OpenAI({
		apiKey: typeof apiKey === "string" ? apiKey : null,
	});
} catch (error) {
	console.error(
		"The OPENAI_API_KEY environment variable is missing. Please provide it as an environment variable or as an argument to the OpenAI constructor.",
	);
}

function parseRawFile(
	file_path: string,
): { testId: string; testSteps: string[] }[] {
	const fileContent = fs
		.readFileSync(file_path, "utf-8")
		.replace(/\r\n/g, "\n");
	const lines = fileContent.split("\n");
	const tests: { testId: string; testSteps: string[] }[] = [];
	let current_test: { testId: string; testSteps: string[] } | null = null;
	let isCucumberTest = false;

	const cucumberTitleRegex = /^(?:\.|)Starting Scenario: (.*)/;
	const testTitleRegex =
		/^\s*✓\s+\d+\s+([\w\/.-]+:\d+:\d+)\s+›\s+(.*?)(?:\s+\(([\d.]+)ms\))?$/;
	const cucumberActionRegex = /(?:pw:api|Z pw:api) .*/;
	const playwrightActionRegex = /pw:api.*?=>\s*(.*?)\s*[\u001b\[\d;]+m\+/;

	for (const line of lines) {
		const stripped_line = line.trim();

		if (cucumberTitleRegex.test(stripped_line)) {
			tests.push(current_test);
			const scenarioMatch = stripped_line.match(cucumberTitleRegex);
			current_test = { testId: scenarioMatch[1], testSteps: [] };
			isCucumberTest = true;
		} else if (isCucumberTest && cucumberActionRegex.test(stripped_line)) {
			current_test.testSteps.push(stripped_line);
		}

		if (testTitleRegex.test(stripped_line)) {
			current_test = { testId: stripped_line, testSteps: [] };
			tests.push(current_test);
			isCucumberTest = false;
		} else if (playwrightActionRegex.test(stripped_line)) {
			if (!current_test) {
				continue;
			}
			console.log(stripped_line);
			current_test.testSteps.push(stripped_line);
		}
	}

	if (current_test && current_test?.testSteps.length) {
		tests.push(current_test);
	}
	console.log(tests);
	return tests;
}

function summarizeSteps(steps: any[]) {
	const keyPhrases = [
		"navigating to",
		"fill",
		"waiting for",
		"click",
		"navigated to",
	].map((phrase) => phrase.toLowerCase());

	return steps
		.map((step: string) => {
			const actionIndex = step.toLowerCase().indexOf("pw:api");
			if (actionIndex === -1) {
				console.error(`"pw:api" not found in step: ${step}`);
				return null;
			}
			const startIndex = step.indexOf(" ", actionIndex + "pw:api".length) + 1;
			if (startIndex === 0) {
				console.error(`Action not found after "pw:api" in step: ${step}`);
				return null;
			}
			const summarizedStep = step.substring(startIndex).trim();
			console.log(`Summarized Step: ${summarizedStep}`);
			return summarizedStep;
		})
		.filter((step: string) => {
			const shouldKeep =
				step !== null &&
				keyPhrases.some((phrase) => step.toLowerCase().includes(phrase));
			console.log(`Step "${step}" kept: ${shouldKeep}`);
			return shouldKeep;
		});
}

async function canMerge(
	test1: string[],
	test2: string[],
	similarity_percentage: number,
): Promise<string> {
	if (similarity_percentage <= 70) {
		return "No merge suggested due to low similarity";
	}
	const prompt = `Can these two test cases be merged? If yes, suggest how.\n\nTest 1: ${test1}\nTest 2: ${test2}`;

	if (openai.apiKey) {
		const response = await openai.completions.create({
			model: "gpt-3.5-turbo-instruct",
			prompt: prompt,
			max_tokens: 700,
		});

		const mergeSuggestion = response.choices[0].text.trim();

		if (!mergeSuggestion.toLowerCase().includes("yes")) {
			return mergeSuggestion;
		}

		const suggestedSteps = mergeSuggestion.split(", ");
		return suggestedSteps
			.map((step) => `- ${step.trim().replace(/'/g, "")}`)
			.join("\n");
	} else {
		return "OpenAI API key not provided. Cannot generate merge suggestion.";
	}
}

async function evaluateAndReport(
	test1: [string, string[]],
	test2: [string, string[]],
	similarity_percentage: number,
): Promise<{
	"Test 1": { Name: string; Steps: string[] };
	"Test 2": { Name: string; Steps: string[] };
	Similarity: number;
	"Merge Suggestion": string;
}> {
	const [test1_name, test1_steps] = test1;
	const [test2_name, test2_steps] = test2;
	console.log("-===========================");
	const merge_suggestion = await canMerge(
		test1_steps,
		test2_steps,
		similarity_percentage,
	);

	return {
		"Test 1": {
			Name: test1_name,
			Steps: test1_steps,
		},
		"Test 2": {
			Name: test2_name,
			Steps: test2_steps,
		},
		Similarity: similarity_percentage,
		"Merge Suggestion": merge_suggestion,
	};
}

function findFirstMatchIndex(
	smallerSteps: string[],
	largerSteps: string[],
): number {
	let matchCount = 0;
	let usedIndices = new Set();

	smallerSteps.forEach((smallStep) => {
		for (let i = 0; i < largerSteps.length; i++) {
			if (smallStep === largerSteps[i] && !usedIndices.has(i)) {
				matchCount++;
				usedIndices.add(i);
				break;
			}
		}
	});

	return matchCount;
}

export default async function calculateSimilarity(logFilePath: string) {
	try {
		const tests = parseRawFile(logFilePath);
		console.log(tests);

		const filtered_tests = tests.filter((test) => test.testSteps.length >= 5);
		const tests_tuples: [string, string[]][] = filtered_tests.map((test) => [
			test.testId,
			test.testSteps,
		]);

		console.log(filtered_tests);
		console.log(tests_tuples);

		const report: {
			"Test 1": { Name: string; Steps: string[] };
			"Test 2": { Name: string; Steps: string[] };
			Similarity: number;
			"Merge Suggestion": string;
		}[] = [];

		for (let i = 0; i < tests_tuples.length; i++) {
			for (let j = i + 1; j < tests_tuples.length; j++) {
				const [test1_id, test1_steps] = tests_tuples[i];
				const [test2_id, test2_steps] = tests_tuples[j];

				const summarizedTest1Steps = summarizeSteps(test1_steps);
				const summarizedTest2Steps = summarizeSteps(test2_steps);

				console.log(
					"-=== Summarized summarizedTest1Steps:",
					summarizedTest1Steps,
				);
				console.log(
					"-=== Summarized summarizedTest2Steps:",
					summarizedTest2Steps,
				);

				const matchCount = findFirstMatchIndex(
					summarizedTest1Steps,
					summarizedTest2Steps,
				);
				const similarity_percentage =
					(matchCount / summarizedTest1Steps.length) * 100;

				console.log(
					`Similarity between "${test1_id}" and "${test2_id}": ${similarity_percentage.toFixed(
						2,
					)}%`,
				);

				const reportEntry = await evaluateAndReport(
					[test1_id, summarizedTest1Steps],
					[test2_id, summarizedTest2Steps],
					similarity_percentage,
				);
				report.push(reportEntry);
			}
		}

		const report_json = JSON.stringify(report, null, 4);
		const htmlReport = generateHtmlReport(report_json);
		fs.writeFileSync("report.html", htmlReport);
	} catch (error) {
		console.error("An error occurred:", error);
	}
}

function generateHtmlReport(reportJson: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
    <title>Report</title>
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,500&display=swap" rel="stylesheet">
    <style>   
    body {
        font-family: 'Roboto', sans-serif;
        background-color: #121212; /* Dark background */
        color: #e0e0e0; /* Light text color for contrast */
        padding: 20px;
    }
    
    .card {
        background-color: #1e1e1e; /* Darker shade for card background */
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* Stronger shadow for depth */
        margin-bottom: 20px;
        padding: 15px;
        color: #ffffff; /* White text on dark backgrounds */
    }
    
    .test-case-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #bb86fc; /* Light purple for titles, for a bit of color */
    }
    
    .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
    }
    
    .col {
        flex: 1;
        margin-right: 10px;
    }
    
    pre {
        background-color: #242424; /* Slightly lighter gray for pre blocks */
        border: 1px solid #333333; /* Dark border */
        padding: 10px;
        overflow-x: auto;
        white-space: pre-wrap; /* Wrap long lines */
        word-break: break-all;
        color: #b0b0b0; /* Light gray text for readability */
    }
    
    .test-case-footer {
        font-weight: bold;
        margin-top: 10px;
        color: #f2f2f2; /* Slightly off-white for less harsh contrast */
    }
    
    .merge-suggestion {
        margin-top: 10px;
        padding: 10px;
        background-color: #333366; /* Dark blue background */
        color: #d1c4e9; /* Light purple text */
        border-radius: 4px;
    }
    
    .same-step {
        color: #bb86fc; /* Same color as the title */
    }
    
    .threshold-input {
        margin-bottom: 20px;
        color: #bb86fc; /* Match the title color */
    }
    
    .threshold-input label {
        font-weight: bold;
        margin-right: 10px;
    }
    
    .threshold-input input {
        border: 1px solid #333333; /* Dark border */
        background-color: #1e1e1e; /* Dark background */
        color: #ffffff; /* White text */
        border-radius: 4px;
        padding: 5px 10px;
        width: 100px;
        -webkit-appearance: none; /* Removes default webkit styles */
        -moz-appearance: textfield; /* Removes the spinner from Firefox */
    }
    
    /* For Webkit browsers like Chrome, Safari */
    .threshold-input input::-webkit-outer-spin-button,
    .threshold-input input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    /* For Firefox */
    .threshold-input input[type='number'] {
        -moz-appearance: textfield;
    }
    
    .threshold-input small {
        display: block;
        color: #cccccc;
        margin-top: 5px;
    } </style>
</head>
<body>
    <div class="threshold-input">
        <label for="similarityThreshold">Similarity Threshold (%): </label>
        <input type="number" id="similarityThreshold" value="70" min="0" max="100" placeholder="Enter value and press Enter">
        <small>Press Enter to apply</small>
    </div>
    <div class="container">
        <h1 class="my-4">Similarity Report 1</h1>
    </div>
    <script>
    const reportData = ${reportJson};
    function createReportEntryHtml(entry) {
        let test1Title = entry["Test 1"]["Name"];
        let test1Steps = entry["Test 1"]["Steps"];
        let test2Title = entry["Test 2"]["Name"];
        let test2Steps = entry["Test 2"]["Steps"];
        let similarity = Math.round(entry["Similarity"] * 100) / 100;
        let mergeSuggestion = entry["Merge Suggestion"];
      
        let maxLength = Math.max(test1Steps.length, test2Steps.length);
        let reportHtml = "<div class='card my-4'>";
      
        reportHtml += \`<div class='test-case-title'>\${test1Title} vs \${test2Title}</div>\`;
        reportHtml += "<div class='row'>";
      
        reportHtml += "<div class='col'><h5>" + test1Title + "</h5><pre>";
        for (let j = 0; j < maxLength; j++) {
          let stepClass = test1Steps[j] === test2Steps[j] ? "same-step" : "";
          reportHtml += \`<span class='\${stepClass}'>\${test1Steps[j] || "----"}</span><br>\`;
        }
        reportHtml += "</pre></div>";
      
        reportHtml += "<div class='col'><h5>" + test2Title + "</h5><pre>";
        for (let j = 0; j < maxLength; j++) {
          let stepClass = test1Steps[j] === test2Steps[j] ? "same-step" : "";
          reportHtml += \`<span class='\${stepClass}'>\${test2Steps[j] || "----"}</span><br>\`;
        }
        reportHtml += "</pre></div>";
      
        reportHtml += "</div>"; // Close row
        reportHtml += \`<div class='test-case-footer'>Similarity: \${similarity}%</div>\`;
      
        if (mergeSuggestion) {
          reportHtml += "<div class='merge-suggestion'><strong>Merge Suggestion:</strong><br>" + mergeSuggestion + "</div>";
        }
      
        reportHtml += "</div>"; // Close card
      
        return reportHtml;
    }
    
    function filterAndDisplayReports(threshold) {
        const reportContainer = document.querySelector(".container");
        reportContainer.innerHTML = ""; // Clear existing reports
      
        reportData.forEach((entry) => {
          if (entry["Similarity"] >= threshold) {
            reportContainer.innerHTML += createReportEntryHtml(entry);
          }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const similarityInput = document.getElementById("similarityThreshold");
      
        // Initial display with default value
        filterAndDisplayReports(similarityInput.value);
      
        similarityInput.addEventListener("change", () => {
          filterAndDisplayReports(similarityInput.value);
        });
    });
    </script>
</body>
</html>`;
}

calculateSimilarity("./playwright-debug.log");
