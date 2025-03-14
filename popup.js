document.getElementById("checkDomains").addEventListener("click", function() {
    console.log("Button clicked, starting domain check.");
    let inputText = document.getElementById("domainInput").value.trim();
    if (!inputText) {
        alert("Please enter at least one domain.");
        return;
    }

    let domains = inputText.split("\n").map(d => d.trim()).filter(Boolean);
    console.log("Parsed domains:", domains);

    chrome.runtime.sendMessage({ action: "checkDomains", domains }, function(response) {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
            return;
        }

        let resultsTable = document.getElementById("resultsTable");
        resultsTable.innerHTML = ""; // Clear old results

        response.results.forEach(({ domain, resultCount, isShopping }) => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${domain}</td>
                <td>${resultCount}</td>
                <td>${isShopping}</td>
            `;
            resultsTable.appendChild(row);
        });
    });
});
