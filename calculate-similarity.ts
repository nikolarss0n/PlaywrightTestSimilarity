import * as fs from "fs";
import OpenAI from "openai";

let openai: OpenAI;

try {
  openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"] || null,
  });
} catch (error) {
  console.error("The OPENAI_API_KEY environment variable is missing. Please provide it as an environment variable or as an argument to the OpenAI constructor.");
}

function calculateJaccardSimilarity(steps1: string[], steps2: string[]): number {
  const set1 = new Set(steps1);
  const set2 = new Set(steps2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
}

function parseRawFile(file_path: string): { testId: string; testSteps: string[] }[] {
  const fileContent = fs.readFileSync(file_path, "utf-8");
  const lines = fileContent.split("\n");
  const tests: { testId: string; testSteps: string[] }[] = [];
  let current_test: { testId: string; testSteps: string[] } | null = null;

  for (const line of lines) {
    const stripped_line = line.trim();
    const test_id_match = stripped_line.match(/✓ (.*)/);
    const test_step_match = stripped_line.match(/(cy:.*)/);

    if (test_id_match) {
      if (current_test) {
        tests.push(current_test);
      }
      current_test = { testId: test_id_match[1], testSteps: [] };
    } else if (test_step_match && current_test) {
      current_test.testSteps.push(test_step_match[1]);
    }
  }

  if (current_test) {
    tests.push(current_test);
  }

  return tests;
}

function summarizeSteps(steps: string[]): string {
  const key_actions = ["click", "type", "new url", "assert"];
  return steps.filter((step, index) => key_actions.some((action) => step.includes(action)) || index < 10).join(" ");
}

async function canMerge(test1: string[], test2: string[], similarity_percentage: number): Promise<string> {
  if (similarity_percentage <= 70) {
    return "No merge suggested due to low similarity";
  }

  const test1_summary = summarizeSteps(test1);
  const test2_summary = summarizeSteps(test2);
  const prompt = `Can these two test cases be merged? If yes, suggest how.\n\nTest 1: ${test1_summary}\nTest 2: ${test2_summary}`;

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
    return suggestedSteps.map((step) => `- ${step.trim().replace(/'/g, "")}`).join("\n");
  } else {
    return "OpenAI API key not provided. Cannot generate merge suggestion.";
  }
}

async function evaluateAndReport(
  test1: [string, string[]],
  test2: [string, string[]],
  similarity_percentage: number
): Promise<{
  "Test 1": { Name: string; Steps: string[] };
  "Test 2": { Name: string; Steps: string[] };
  Similarity: number;
  "Merge Suggestion": string;
}> {
  const [test1_name, test1_steps] = test1;
  const [test2_name, test2_steps] = test2;

  let merge_suggestion = await canMerge(test1_steps, test2_steps, similarity_percentage);

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

async function main() {
  try {
    const raw_file_path = process.argv[2] || "cypress-log.txt";
    const tests = parseRawFile(raw_file_path);

    const filtered_tests = tests.filter((test) => test.testSteps.length >= 5);
    const tests_tuples: [string, string[]][] = filtered_tests.map((test) => [test.testId, test.testSteps]);

    // Optionally write to debug.json in a development environment
    if (process.env.NODE_ENV === "development") {
      fs.writeFileSync("debug.json", JSON.stringify(tests_tuples, null, 4));
    }

    const report: {
      "Test 1": { Name: string; Steps: string[] };
      "Test 2": { Name: string; Steps: string[] };
      Similarity: number;
      "Merge Suggestion": string;
    }[] = [];

    for (let i = 0; i < tests_tuples.length; i++) {
      for (let j = i + 1; j < tests_tuples.length; j++) {
        const similarity_percentage = calculateJaccardSimilarity(tests_tuples[i][1], tests_tuples[j][1]);
        const reportEntry = await evaluateAndReport(tests_tuples[i], tests_tuples[j], similarity_percentage);
        report.push(reportEntry);
      }
    }

    const report_json = JSON.stringify(report, null, 4);
    fs.writeFileSync("report.html", generateHtmlReport(report_json));
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

function generateHtmlReport(reportJson: string): string {
  // HTML template with externalized CSS
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Report</title>
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,500&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="reportStyle.css">
    </head>
    <body>
        <div class="threshold-input">
          <label for="similarityThreshold">Similarity Threshold (%): </label>
          <input type="number" id="similarityThreshold" value="70" min="0" max="100" placeholder="Enter value and press Enter">
          <small>Press Enter to apply</small>
        </div>
        <div class="container box">
            <h1 class="my-4">Similarity Report 1</h1>
        </div>
        <script>
        const reportData = ${reportJson};
        </script>
        <script src="reportScript.js"></script>
    </body>
    </html>
    `;
}

main();
