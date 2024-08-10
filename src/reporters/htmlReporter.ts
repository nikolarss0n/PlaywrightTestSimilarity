import type { EvaluationReport } from "../services/openAIService";

export class HtmlReporter {
	private readonly cssStyles: string = `
    a {
    color: #4caf50; /* Example color */
    text-decoration: none; /* Remove underline */
}

a:hover {
    color: #388e3c; /* Example hover color */
    text-decoration: underline; /* Add underline on hover */
}
        body {
            font-family: 'Roboto', sans-serif;
            background-color: #121212;
            color: #e0e0e0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background-color: #1e1e1e;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            padding: 20px;
            color: #ffffff;
        }
        .test-case-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #4caf50;
        }
        .row {
            display: flex;
            flex-wrap: wrap;
            margin: 0 -10px;
        }
        .col {
            flex: 1;
            padding: 0 10px;
            min-width: 300px;
        }
        pre {
            background-color: #242424;
            border: 1px solid #333333;
            border-radius: 4px;
            padding: 10px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            color: #b0b0b0;
            font-size: 14px;
        }
        .test-case-footer {
            font-weight: bold;
            margin-top: 15px;
            color: #4caf50;
        }
        .merge-suggestion {
            margin-top: 15px;
            padding: 15px;
            background-color: hsl(120, 100%, 25%);
            color: #ffffff;
            border-radius: 4px;
        }
        .same-step {
            color: #4caf50;
            font-weight: bold;
        }
        .threshold-input {
            margin-bottom: 30px;
            color: #4caf50;
        }
        .threshold-input label {
            font-weight: bold;
            margin-right: 10px;
        }
        .threshold-input input {
            border: 1px solid #333333;
            background-color: #1e1e1e;
            color: #ffffff;
            border-radius: 4px;
            padding: 8px 12px;
            width: 120px;
            font-size: 16px;
        }
        .threshold-input small {
            display: block;
            color: #b0b0b0;
            margin-top: 5px;
        }
        .summary-section {
            background-color: #2a2a2a;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .summary-title {
            font-size: 24px;
            color: #4caf50;
            margin-bottom: 15px;
        }
        .summary-stats {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        .stat-item {
            text-align: center;
            margin: 10px;
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #4caf50;
        }
        .stat-label {
            font-size: 14px;
            color: #b0b0b0;
        }
        .similarity-matrix {
            overflow-x: auto;
            margin-top: 20px;
        }
        .similarity-matrix table {
            border-collapse: collapse;
            width: 100%;
        }
        .similarity-matrix th, .similarity-matrix td {
            border: 1px solid #444;
            padding: 8px;
            text-align: center;
            font-size: 14px;
        }
        .similarity-matrix th {
            background-color: #333;
            color: #fff;
            font-weight: bold;
        }
        .similarity-cell {
            transition: background-color 0.3s;
            color: #000;
            font-weight: bold;
        }
        .similarity-cell:hover {
            background-color: #4caf50;
            color: #000;
        }
        .color-legend {
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .legend-item {
            display: inline-block;
            width: 40px;
            text-align: center;
            padding: 2px 5px;
            margin: 0 2px;
            color: #000;
            font-weight: bold;
        }
        @media (max-width: 768px) {
            .row {
                flex-direction: column;
            }
            .col {
                margin-bottom: 20px;
            }
        }
    `;

	private readonly scriptContent: string = `
        function createReportEntryHtml(entry) {
            const test1Title = entry["Test 1"]["Name"];
            const test1Steps = entry["Test 1"]["Steps"];
            const test2Title = entry["Test 2"]["Name"];
            const test2Steps = entry["Test 2"]["Steps"];
            const similarity = Math.round(entry["Similarity"] * 100) / 100;
            const mergeSuggestion = entry["Merge Suggestion"];
            
            const maxLength = Math.max(test1Steps.length, test2Steps.length);
            let reportHtml = "<div class='card'>";
            
            reportHtml += \`<div class='test-case-title'>\${test1Title} vs \${test2Title}</div>\`;
            reportHtml += "<div class='row'>";
            
            reportHtml += createTestStepsHtml(test1Title, test1Steps, test2Steps, maxLength);
            reportHtml += createTestStepsHtml(test2Title, test2Steps, test1Steps, maxLength);
            
            reportHtml += "</div>"; // Close row
            reportHtml += \`<div class='test-case-footer'>Similarity: \${similarity}%</div>\`;
            
            if (mergeSuggestion) {
                reportHtml += "<div class='merge-suggestion'><strong>Merge Suggestion:</strong><br>" + mergeSuggestion + "</div>";
            }
            
            reportHtml += "</div>"; // Close card
            
            return reportHtml;
        }

        function createTestStepsHtml(title, steps, compareSteps, maxLength) {
            let html = \`<div class="col"><h3>\${title}</h3><pre>\`;
            for (let j = 0; j < maxLength; j++) {
                const stepClass = steps[j] === compareSteps[j] ? "same-step" : "";
                html += \`<span class="\${stepClass}">\${j + 1}. \${steps[j] || "----"}</span>\n\`;
            }
            html += "</pre></div>";
            return html;
        }
        
        function createSimilarityMatrix(reportData) {
            const allTestNames = [...new Set(reportData.flatMap(entry => [entry['Test 1'].Name, entry['Test 2'].Name]))];
            const testNames = allTestNames.slice(0, 5); // Limit to first 5 tests
            let matrixHtml = '<div class="similarity-matrix"><table><tr><th></th>';
            
            testNames.forEach(name => {
                matrixHtml += \`<th>\${name}</th>\`;
            });
            matrixHtml += '</tr>';

            testNames.forEach(name1 => {
                matrixHtml += \`<tr><th>\${name1}</th>\`;
                testNames.forEach(name2 => {
                    if (name1 === name2) {
                        matrixHtml += '<td>-</td>';
                    } else {
                        const entry = reportData.find(e => 
                            (e['Test 1'].Name === name1 && e['Test 2'].Name === name2) ||
                            (e['Test 1'].Name === name2 && e['Test 2'].Name === name1)
                        );
                        const similarity = entry ? Math.round(entry.Similarity) : 0;
                        const backgroundColor = \`hsl(\${120 * similarity / 100}, 100%, \${40 + (similarity / 2)}%)\`;
                        matrixHtml += \`<td class="similarity-cell" style="background-color: \${backgroundColor}">\${similarity}%</td>\`;
                    }
                });
                matrixHtml += '</tr>';
            });

            matrixHtml += '</table></div>';
            if (allTestNames.length > 5) {
                matrixHtml += \`<p>Showing 5 out of \${allTestNames.length} tests. See full list below for all tests.</p>\`;
            }
            return matrixHtml;
        }

        function createColorLegend() {
            let legendHtml = '<div class="color-legend"><span>Similarity: </span>';
            for (let i = 0; i <= 100; i += 25) {
                const backgroundColor = \`hsl(\${120 * i / 100}, 100%, \${40 + (i / 2)}%)\`;
                legendHtml += \`<span class="legend-item" style="background-color: \${backgroundColor}">\${i}%</span>\`;
            }
            legendHtml += '</div>';
            return legendHtml;
        }

        function createSummarySection(reportData) {
            const totalTests = new Set(reportData.flatMap(entry => [entry['Test 1'].Name, entry['Test 2'].Name])).size;
            const similarTests = reportData.filter(entry => entry.Similarity >= 70).length;
            const avgSimilarity = Math.round(reportData.reduce((sum, entry) => sum + entry.Similarity, 0) / reportData.length);

            return \`
                <div class="summary-section">
                    <h2 class="summary-title">Test Similarity Overview</h2>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-value">\${totalTests}</div>
                            <div class="stat-label">Total Tests</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${similarTests}</div>
                            <div class="stat-label">Similar Tests (≥70%)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${avgSimilarity}%</div>
                            <div class="stat-label">Average Similarity</div>
                        </div>
                    </div>
                    \${createSimilarityMatrix(reportData)}
                    \${createColorLegend()}
                </div>
            \`;
        }

        function createFullTestList(reportData) {
            const allTests = [...new Set(reportData.flatMap(entry => [entry['Test 1'].Name, entry['Test 2'].Name]))];
            let listHtml = '<div class="full-test-list"><h3>Full List of Tests</h3><ol>';
            allTests.forEach(test => {
                listHtml += \`<li>\${test}</li>\`;
            });
            listHtml += '</ol></div>';
            return listHtml;
        }

        function filterAndDisplayReports(threshold) {
            const reportContainer = document.getElementById("reportContainer");
            reportContainer.innerHTML = ""; // Clear existing reports
            
            let displayedReports = 0;
            reportData.forEach((entry) => {
                if (entry["Similarity"] >= threshold) {
                    reportContainer.innerHTML += createReportEntryHtml(entry);
                    displayedReports++;
                }
            });
            
            reportContainer.innerHTML += \`<p>Displaying \${displayedReports} out of \${reportData.length} total comparisons.</p>\`;
        }

        function initializeReport() {
            const summarySection = document.getElementById('summarySection');
            summarySection.innerHTML = createSummarySection(reportData);

            const fullTestListSection = document.getElementById('fullTestListSection');

            const similarityInput = document.getElementById("similarityThreshold");
            filterAndDisplayReports(parseFloat(similarityInput.value));
            
            similarityInput.addEventListener("input", () => {
                filterAndDisplayReports(parseFloat(similarityInput.value));
            });
        }

        document.addEventListener("DOMContentLoaded", initializeReport);
    `;

	public generateHtmlReport(reportData: EvaluationReport[]): string {
		const reportJson = JSON.stringify(reportData);

		return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test Similarity Report</title>
                <link href="https://fonts.googleapis.com/css?family=Roboto:400,500&display=swap" rel="stylesheet">
                <style>${this.cssStyles}</style>
            </head>
            <body>
                <div class="container">
                    <h1>Test Similarity Report</h1>
                    <div id="summarySection"></div>
                    <div id="fullTestListSection"></div>
                    <div class="threshold-input">
                        <label for="similarityThreshold">Similarity Threshold (%): </label>
                        <input type="number" id="similarityThreshold" value="70" min="0" max="100" step="5">
                        <small>Adjust the value to filter results</small>
                    </div>
                    <div id="reportContainer"></div>
                </div>
                <script>
                    const reportData = ${reportJson};
                    ${this.scriptContent}
                </script>
            </body>
            </html>
        `;
	}
}

export function generateHtmlReport(reportData: EvaluationReport[]): string {
	const reporter = new HtmlReporter();
	return reporter.generateHtmlReport(reportData);
}
