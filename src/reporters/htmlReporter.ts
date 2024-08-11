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
        max-width: 70%;
        width: 70%;
        margin: 0 auto;
        padding: 0 20px;
        box-sizing: border-box;
    }
    .card {
        background-color: #1e1e1e;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        padding: 20px;
        color: #ffffff;
        overflow-x: auto;
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
        margin: 0 auto;
        margin-bottom: 15px;
        text-align: center;
        width: 100%;
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
        overflow: visible;
        margin-top: 20px;
        width: 100%;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
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
    .color-legend span {
        margin-right: 10px;
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
    .test-columns {
        display: flex;
        justify-content: space-between;
        min-width: 100%;
    }
    .test-column {
        flex: 0 0 48%; /* Adjust this value as needed */
        padding: 0 10px;
        min-width: 300px;
    }
    .step-container {
        display: flex;
        flex-direction: column;
    }
    .step-row {
        display: flex;
        min-height: 30px; /* Adjust this value as needed */
    }
    .step-cell {
        flex: 1;
        padding: 5px;
        border-bottom: 1px solid #333;
        display: flex;
        align-items: center;
        word-break: break-word;
    }
    .node {
        fill: #4caf50;
    }
    .link {
        stroke: #888;
        stroke-opacity: 0.6;
    }
    .node-label {
        font-size: 12px;
        fill: #fff;
        text-anchor: middle;
        dominant-baseline: central;
    }
    .matched-step {
        background-color: rgba(76, 175, 80, 0.2);
    }
    @media (max-width: 768px) {
        .test-columns {
            flex-direction: column;
        }
        .test-column {
            flex: 1 0 auto;
            margin-bottom: 20px;
        }
    }
            .similarity-matrix {
        overflow: visible;
        margin-top: 20px;
        width: 100%;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }
    .similarity-matrix svg {
        width: 100%;
        height: auto;
        background-color: #1a1a1a;
        border-radius: 8px;
    }
    .node {
        fill: #4caf50;
        transition: all 0.3s ease;
    }
    .node:hover {
        fill: #45a049;
        r: 15;
    }
    .link {
        stroke-opacity: 0.6;
        transition: all 0.3s ease;
    }
    .link:hover {
        stroke-opacity: 1;
    }
    .node-label {
        font-size: 7px;
        fill: #fff;
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
    }
    .similarity-label {
        font-size: 7px;
        text-anchor: middle;
        dominant-baseline: central;
        font-weight: bold;
        pointer-events: none;
        text-shadow: 0 0 2px #000, 0 0 2px #000, 0 0 2px #000; /* Enhanced text shadow for better visibility */
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
        
        reportHtml += \`<div class='test-case-title'>\${test1Title} vs \${test2Title}</div>\`;
        reportHtml += "<div class='test-columns'>";
        
        reportHtml += createTestStepsHtml(test1Title, test2Title, test1Steps, test2Steps, matchedSteps);
        
        reportHtml += "</div>"; // Close test-columns
        reportHtml += \`<div class='test-case-footer'>Similarity: \${similarity}%</div>\`;
        
        if (mergeSuggestion) {
            reportHtml += "<div class='merge-suggestion'><p>Merge Suggestion:</p>" + mergeSuggestion + "</div>";
        }
        
        reportHtml += "</div>"; // Close card
        
        return reportHtml;
    }
    
    function createTestStepsHtml(title1, title2, steps1, steps2, matchedSteps) {
        const maxLength = Math.max(steps1.length, steps2.length);
        
        let html = \`
            <div class="test-column">
                <h3>\${escapeHtml(title1)}</h3>
                <div class="step-container">
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
                <h3>\${escapeHtml(title2)}</h3>
                <div class="step-container">
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
        \`;
        
        return html;
    }

    function countSteps(steps) {
        const counts = new Map();
        steps.forEach(step => {
            counts.set(step, (counts.get(step) || 0) + 1);
        });
        return counts;
    }

    function isMatchingStep(step, stepCounts) {
        return stepCounts.has(step) && stepCounts.get(step) > 0;
    }
    
    function createSimilarityMatrix(reportData) {
        const allTestNames = [...new Set(reportData.flatMap(entry => [entry['Test 1'].Name, entry['Test 2'].Name]))];
        const testNames = allTestNames.slice(0, 5); // Limit to first 5 tests
        const n = testNames.length;
        const radius = 180;
        const centerX = 250;
        const centerY = 250;

        let matrixHtml = '<div class="similarity-matrix"><svg viewBox="0 0 500 500" id="similarityGraph">';

        // Create links
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const entry = reportData.find(e =>
                    (e['Test 1'].Name === testNames[i] && e['Test 2'].Name === testNames[j]) ||
                    (e['Test 1'].Name === testNames[j] && e['Test 2'].Name === testNames[i])
                );
                if (entry) {
                    const similarity = Math.round(entry.Similarity);
                    const x1 = centerX + radius * Math.cos(i * 2 * Math.PI / n);
                    const y1 = centerY + radius * Math.sin(i * 2 * Math.PI / n);
                    const x2 = centerX + radius * Math.cos(j * 2 * Math.PI / n);
                    const y2 = centerY + radius * Math.sin(j * 2 * Math.PI / n);
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const strokeWidth = similarity / 25; // Thinner lines
                    const strokeColor = \`hsl(\${120 * similarity / 100}, 100%, \${40 + (similarity / 2)}%)\`;
                    
                    matrixHtml += \`<line class="link" x1="\${x1}" y1="\${y1}" x2="\${x2}" y2="\${y2}" 
                                    stroke="\${strokeColor}" stroke-width="\${strokeWidth}"></line>\`;
                    matrixHtml += \`<text class="similarity-label" x="\${midX}" y="\${midY}" 
                                    fill="\${strokeColor}" data-x1="\${x1}" data-y1="\${y1}" data-x2="\${x2}" data-y2="\${y2}">
                                    \${similarity}%</text>\`;
                }
            }
        }

        // Create nodes
        testNames.forEach((name, i) => {
            const x = centerX + radius * Math.cos(i * 2 * Math.PI / n);
            const y = centerY + radius * Math.sin(i * 2 * Math.PI / n);
            matrixHtml += \`<circle class="node" cx="\${x}" cy="\${y}" r="10" data-original-cx="\${x}" data-original-cy="\${y}"></circle>\`;
            matrixHtml += \`<text class="node-label" x="\${x}" y="\${y}">\${name}</text>\`;
        });

        matrixHtml += '</svg></div>';
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
        fullTestListSection.innerHTML = createFullTestList(reportData);

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
                labels[index].setAttribute('y', newY);

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
