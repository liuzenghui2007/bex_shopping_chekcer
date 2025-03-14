chrome.runtime.onInstalled.addListener(() => {
  console.log("Shopping Domain Checker Extension Installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkDomains") {
    (async () => {
      try {
        let results = await Promise.all(
          request.domains.map(async (domain) => {
            console.log(`Checking domain: ${domain}`);
            let resultCount = await searchGoogle(domain);
            console.log(`Search result count for ${domain}:`, resultCount);
            let isShopping = resultCount > 5 ? "✅ Yes" : "❌ No";
            return { domain, resultCount, isShopping };
          })
        );
        sendResponse({ results });
      } catch (error) {
        console.error("Error processing domains:", error);
        sendResponse({ results: [] });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

async function searchGoogle(domain) {
  const query = `site:${domain} "buy now" OR "add to cart" OR "checkout"`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(
        tabId,
        changeInfo,
        tab
      ) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                // Extract the number of search results from the page
                const resultStats = document.getElementById("result-stats");
                return resultStats ? resultStats.innerText : "0 results";
              },
            },
            (results) => {
              if (chrome.runtime.lastError || !results || !results[0]) {
                reject("Failed to extract results");
              } else {
                const resultText = results[0].result;
                const match = resultText.match(/About ([\d,]+) results/);
                const resultCount = match
                  ? parseInt(match[1].replace(/,/g, ""))
                  : 0;
                resolve(resultCount);
              }
            }
          );
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  });
}
