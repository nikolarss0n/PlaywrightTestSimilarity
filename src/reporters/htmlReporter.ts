import type { EvaluationReport } from "../services/openAIService";

export class HtmlReporter {
	private readonly cssStyles: string = `
.test-case-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
    color: rgb(215 252 3 / 0.9);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 10px;
}

.test-case-title::after {
    content: 'Collapse ▲';
    font-size: 0.8em;
    transition: transform 0.3s ease;
}

.test-case-title.collapsed::after {
    content: 'Expand ▼';
    transform: rotate(0deg);
}

        .test-columns {
            display: flex;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .test-columns.collapsed {
            max-height: 0;
        }

        .test-column {
            flex: 1;
            min-width: 300px;
            padding: 0 10px;
            display: flex;
            flex-direction: column;
        }

        .column-content {
            flex: 1;
            overflow-y: auto;
        }

        .test-column:first-child {
            border-right: 1px solid rgba(255, 255, 255, 0.3);
        }

        .test-column .column-content {
            overflow-y: visible;
            overflow-x: hidden;
        }


        .step-container {
            display: flex;
            overflow-y: auto;
            mac0-height: 80vh;
        }

        .test-titles {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .test-title {
            font-weight: bold;
            color: rgb(215 252 3 / 0.9);
        }
            
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-image: url('/src/assets/images/Image.png');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            color: rgba(255, 255, 255, 0.9);
            padding: 20px;
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
        }

        .card, .test-column, .threshold-input {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
                0 4px 30px rgba(0, 0, 0, 0.1),
                inset 0 0 20px rgba(255, 255, 255, 0.05);
            margin-bottom: 20px;
            padding: 20px;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            overflow: hidden;
        }

        .card::before, .test-column::before, .threshold-input::before, .stat-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
            border-radius: 20px 20px 100% 100%;
            pointer-events: none;
        }

        .card:hover, .test-column:hover, .threshold-input:hover, .stat-item:hover {
            transform: translateY(-5px);
            box-shadow:
                0 10px 40px rgba(0, 0, 0, 0.2),
                inset 0 0 30px rgba(255, 255, 255, 0.1);
        }

        .test-case-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: rgb(215 252 3 / 0.9);
        }

  
        .step-row {
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .step-cell {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }


        .matched-step {
            background-color: rgba(215, 252, 3, 0.2);
        }

        .test-case-footer {
            font-weight: bold;
            margin-top: 15px;
            color: rgb(215 252 3 / 0.9);
        }

        .merge-suggestion {
            margin-top: 15px;
            padding: 15px;
            background-color: rgba(215, 252, 3, 0.1);
            border-radius: 10px;
        }

        .threshold-input label {
            font-weight: bold;
            margin-right: 10px;
            color: rgb(215 252 3 / 0.9);
        }

        .threshold-input input {
            border: 1px solid rgba(215, 252, 3, 0.5);
            background-color: rgba(0, 0, 0, 0.3);
            color: #ffffff;
            border-radius: 4px;
            padding: 8px 12px;
            width: 60px;
            font-size: 16px;
        }

        .threshold-input small {
            margin-left: 10px;
            color: rgba(255, 255, 255, 0.7);
        }

        .summary-title {
            font-size: 24px;
            color: rgb(215 252 3 / 0.9);
            margin-bottom: 15px;
            text-align: center;
        }

       .summary-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .stat-item {
            flex: 1;
            text-align: center;
            padding: 15px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
                0 4px 30px rgba(0, 0, 0, 0.1),
                inset 0 0 20px rgba(255, 255, 255, 0.05);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            overflow: hidden;
            margin-right: 10px;
        }

           .stat-item:last-child {
            margin-right: 0; /* Remove right margin for the last stat-item */
        }

        .stat-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
            border-radius: 20px 20px 100% 100%;
            pointer-events: none;
        }

        .stat-item:hover {
            transform: translateY(-5px);
            box-shadow:
                0 10px 40px rgba(0, 0, 0, 0.2),
                inset 0 0 30px rgba(255, 255, 255, 0.1);
        }

       .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: rgb(215 252 3 / 0.9);
        }

        .stat-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }

        .similarity-matrix {
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 20px;
            padding: 20px;
            margin-top: 30px;
            margin-bottom: 30px;
        }

        .similarity-matrix table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 2px;
        }

        .similarity-matrix th, .similarity-matrix td {
            text-align: center;
            padding: 10px;
            font-size: 12px;
            border-radius: 5px;
        }

        .similarity-matrix th {
            background-color: rgba(215, 252, 3, 0.2);
            color: rgb(215 252 3 / 0.9);
        }

        .similarity-matrix td {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .similarity-value {
            font-weight: bold;
            color: rgb(215 252 3 / 0.9);
        }

        .node {
            fill: rgb(215 252 3 / 0.9);
            stroke: rgb(215 252 3 / 0.9);
            stroke-width: 2;
            filter: url(#glow);
        }

        .node:hover {
            fill: rgb(229 115 115 / 0.9);
            stroke: rgb(229 115 115 / 0.9);
        }

        .link {
            stroke: rgb(215 252 3 / 0.6);
            stroke-opacity: 0.6;
            filter: url(#glow);
        }

        .link:hover {
            stroke-opacity: 1;
        }

        .node-label {
            fill: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-anchor: middle;
            dominant-baseline: central;
            pointer-events: none;
        }

        .similarity-label {
            fill: #ffffff;
            font-size: 8px;
            font-weight: bold;
            text-anchor: middle;
            dominant-baseline: central;
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .test-columns {
                flex-direction: column;
            }
            
            .test-column {
                margin-bottom: 10px;
            }
        }
    `;

	private readonly scriptContent: string = `
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

           function createReportEntryHtml(entry) {
            const test1Title = entry["Test 1"]["Name"];
            const test1Steps = entry["Test 1"]["Steps"];
            const test2Title = entry["Test 2"]["Name"];
            const test2Steps = entry["Test 2"]["Steps"];
            const similarity = Math.round(entry["Similarity"] * 100) / 100;
            const mergeSuggestion = entry["Merge Suggestion"];
            const matchedSteps = entry["Matched Steps"] || [];
            
            let reportHtml = "<div class='card'>";
            
            reportHtml += \`<div class='test-case-title collapsed' onclick='toggleComparison(this)'>
                                <span>Similarity: \${similarity}%</span>
                                <span>Compare Tests</span>
                            </div>\`;
            reportHtml += \`<div class='test-titles'>
                                <span class='test-title'>\${escapeHtml(test1Title)}</span>
                                <span class='test-title'>\${escapeHtml(test2Title)}</span>
                            </div>\`;
            reportHtml += "<div class='test-columns collapsed'>";
            
            reportHtml += createTestStepsHtml(test1Steps, test2Steps, matchedSteps);
            
            reportHtml += "</div>"; // Close test-columns
            
            if (mergeSuggestion) {
                reportHtml += "<div class='merge-suggestion'><p>Merge Suggestion:</p>" + mergeSuggestion + "</div>";
            }
            
            reportHtml += "</div>"; // Close card
            
            return reportHtml;
        }
        
        
        function createTestStepsHtml(steps1, steps2, matchedSteps) {
    const maxLength = Math.max(steps1.length, steps2.length);
    
    let html = \`
    <div class="step-container">
        <div class="test-column">
            <div class="column-content">
    \`;
    
    for (let i = 0; i < maxLength; i++) {
        const step1 = steps1[i] || "----";
        const isMatched = matchedSteps.some(pair => pair[0] === i && pair[1] === i);
        const rowClass = isMatched ? "matched-step" : "";
        
        html += \`<div class="step-row \${rowClass}">
            <div class="step-cell">\${i + 1}. \${escapeHtml(step1)}</div>
        </div>\`;
    }
    
    html += \`
            </div>
        </div>
        <div class="test-column">
            <div class="column-content">
    \`;
    
    for (let i = 0; i < maxLength; i++) {
        const step2 = steps2[i] || "----";
        const isMatched = matchedSteps.some(pair => pair[0] === i && pair[1] === i);
        const rowClass = isMatched ? "matched-step" : "";
        
        html += \`<div class="step-row \${rowClass}">
            <div class="step-cell">\${i + 1}. \${escapeHtml(step2)}</div>
        </div>\`;
    }
    
    html += \`
            </div>
        </div>
    </div>\`;
    
    return html;
}

        function toggleComparison(element) {
            element.classList.toggle('collapsed');
            element.nextElementSibling.nextElementSibling.classList.toggle('collapsed');
        }

     function createSimilarityMatrix(reportData) {
            const allTestNames = [...new Set(reportData.flatMap(entry => [entry['Test 1'].Name, entry['Test 2'].Name]))];
            const testNames = allTestNames.slice(0, 10); // Limit to first 10 tests
            
            let matrixHtml = '<div class="similarity-matrix"><table><tr><th></th>';
            
            // Create header row
            testNames.forEach(name => {
                matrixHtml += \`<th>\${name}</th>\`;
            });
            matrixHtml += '</tr>';

            // Create rows
            testNames.forEach((name1, i) => {
                matrixHtml += \`<tr><th>\${name1}</th>\`;
                testNames.forEach((name2, j) => {
                    if (i === j) {
                        matrixHtml += '<td>-</td>';
                    } else {
                        const entry = reportData.find(e =>
                            (e['Test 1'].Name === name1 && e['Test 2'].Name === name2) ||
                            (e['Test 1'].Name === name2 && e['Test 2'].Name === name1)
                        );
                        const similarity = entry ? Math.round(entry.Similarity) : '-';
                        const backgroundColor = entry ? \`rgba(215, 252, 3, \${similarity / 100})\` : 'rgba(255, 255, 255, 0.1)';
                        matrixHtml += \`<td style="background-color: \${backgroundColor}"><span class="similarity-value">\${similarity}%</span></td>\`;
                    }
                });
                matrixHtml += '</tr>';
            });

            matrixHtml += '</table></div>';
            if (allTestNames.length > 10) {
                matrixHtml += \`<p>Showing 10 out of \${allTestNames.length} tests. See full list below for all tests.</p>\`;
            }
            return matrixHtml;
        }


      function createSummarySection(reportData) {
            const totalTests = new Set(reportData.flatMap(entry => [entry['Test 1'].Name, entry['Test 2'].Name])).size;
            const similarTests = reportData.filter(entry => entry.Similarity >= 70).length;
            const avgSimilarity = Math.round(reportData.reduce((sum, entry) => sum + entry.Similarity, 0) / reportData.length);

            return \`
                <div class="summary-section">
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
                </div>
            \`;
        }

        function filterAndDisplayReports(threshold) {
            const reportContainer = document.getElementById("reportContainer");
            const displayCountElement = document.getElementById("displayCount");
            reportContainer.innerHTML = ""; // Clear existing reports
            
            let displayedReports = 0;
            reportData.forEach((entry) => {
                if (entry["Similarity"] >= threshold) {
                    reportContainer.innerHTML += createReportEntryHtml(entry);
                    displayedReports++;
                }
            });
            
            displayCountElement.textContent = \`Displaying \${displayedReports} out of \${reportData.length} total comparisons\`;
        }

        function initializeReport() {
            const summarySection = document.getElementById('summarySection');
            summarySection.innerHTML = createSummarySection(reportData);

            const fullTestListSection = document.getElementById('fullTestListSection');
			const space = document.createElement('div');
            const similarityInput = document.getElementById("similarityThreshold");
            filterAndDisplayReports(parseFloat(similarityInput.value));
            
            similarityInput.addEventListener("input", () => {
                filterAndDisplayReports(parseFloat(similarityInput.value));
            });

            // Add animation for nodes
            animateNodes();
        }

        function animateNodes() {
            const nodes = document.querySelectorAll('.node');
            const labels = document.querySelectorAll('.node-label');
            const links = document.querySelectorAll('.link');
            const similarityLabels = document.querySelectorAll('.similarity-label');

            nodes.forEach((node, index) => {
                const originalX = parseFloat(node.getAttribute('data-original-cx'));
                const originalY = parseFloat(node.getAttribute('data-original-cy'));
                let angle = Math.random() * Math.PI * 2;
                let speed = 0.5 + Math.random() * 0.5;
                let radius = 3 + Math.random() * 2;

                function animate() {
                    angle += speed * 0.02;
                    const dx = Math.cos(angle) * radius;
                    const dy = Math.sin(angle) * radius;
                    const newX = originalX + dx;
                    const newY = originalY + dy;

                    // Update node position
                    node.setAttribute('cx', newX);
                    node.setAttribute('cy', newY);

                    // Update label position
                    labels[index].setAttribute('x', newX);
                    labels[index].setAttribute('y', newY + 15);

                    // Update connected lines
                    links.forEach(link => {
                        if (link.getAttribute('x1') == originalX && link.getAttribute('y1') == originalY) {
                            link.setAttribute('x1', newX);
                            link.setAttribute('y1', newY);
                        } else if (link.getAttribute('x2') == originalX && link.getAttribute('y2') == originalY) {
                            link.setAttribute('x2', newX);
                            link.setAttribute('y2', newY);
                        }
                    });

                    // Update similarity labels
                    similarityLabels.forEach(label => {
                        const x1 = parseFloat(label.getAttribute('data-x1'));
                        const y1 = parseFloat(label.getAttribute('data-y1'));
                        const x2 = parseFloat(label.getAttribute('data-x2'));
                        const y2 = parseFloat(label.getAttribute('data-y2'));

                        if (x1 === originalX && y1 === originalY) {
                            label.setAttribute('x', (newX + x2) / 2);
                            label.setAttribute('y', (newY + y2) / 2);
                        } else if (x2 === originalX && y2 === originalY) {
                            label.setAttribute('x', (x1 + newX) / 2);
                            label.setAttribute('y', (y1 + newY) / 2);
                        }
                    });

                    requestAnimationFrame(animate);
                }

                animate();
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
                <link href="https://fonts.googleapis.com/css?family=SF+Pro+Display:400,500&display=swap" rel="stylesheet">
                <style>${this.cssStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <h1>Test Similarity Report</h1>
                    </div>
                    <div id="summarySection"></div>
                    <div id="fullTestListSection"></div>
                    <div class="card threshold-input">
                        <label for="similarityThreshold">Similarity Threshold (%): </label>
                        <input type="number" id="similarityThreshold" value="70" min="0" max="100" step="5">
                        <span id="displayCount" class="display-count"></span>
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
