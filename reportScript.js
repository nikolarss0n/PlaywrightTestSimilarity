function createReportEntryHtml(entry) {
  let test1Title = entry["Test 1"]["Name"];
  let test1Steps = entry["Test 1"]["Steps"];
  let test2Title = entry["Test 2"]["Name"];
  let test2Steps = entry["Test 2"]["Steps"];
  let similarity = Math.round(entry["Similarity"]);
  let mergeSuggestion = entry["Merge Suggestion"];

  let maxLength = Math.max(test1Steps.length, test2Steps.length);
  let reportHtml = "<div class='card my-4'>";

  reportHtml += `<div class='test-case-title'>${test1Title} vs ${test2Title}</div>`;
  reportHtml += "<div class='row'>";

  reportHtml += "<div class='col'><h5>" + test1Title + "</h5><pre>";
  for (let j = 0; j < maxLength; j++) {
    let stepClass = test1Steps[j] === test2Steps[j] ? "same-step" : "";
    reportHtml += `<span class='${stepClass}'>${test1Steps[j] || "----"}</span><br>`;
  }
  reportHtml += "</pre></div>";

  reportHtml += "<div class='col'><h5>" + test2Title + "</h5><pre>";
  for (let j = 0; j < maxLength; j++) {
    let stepClass = test1Steps[j] === test2Steps[j] ? "same-step" : "";
    reportHtml += `<span class='${stepClass}'>${test2Steps[j] || "----"}</span><br>`;
  }
  reportHtml += "</pre></div>";

  reportHtml += "</div>"; // Close row
  reportHtml += `<div class='test-case-footer'>Similarity: ${similarity}%</div>`;

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
