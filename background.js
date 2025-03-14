chrome.runtime.onInstalled.addListener(() => {
    console.log("Shopping Domain Checker Extension Installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkDomains") {
        (async () => {
            try {
                let results = await Promise.all(request.domains.map(async (domain) => {
                    console.log(`Checking domain: ${domain}`);
                    let resultCount = await searchGoogle(domain);
                    console.log(`Search result count for ${domain}:`, resultCount);
                    let isShopping = resultCount > 5 ? "✅ Yes" : "❌ No";
                    return { domain, resultCount, isShopping };
                }));
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
    const apiKey = 'AIzaSyDwOV_XUeKCS5FvP6R3N8PgWMdnhBGOsjY'; // Replace with your actual API key
    const cx = '944618dbc59e64658'; // Replace with your custom search engine ID
    const query = `site:${domain} "buy now" OR "add to cart" OR "checkout"`;
    const resultsPerPage = 10; // Maximum results per page allowed by the API
    let totalMatches = 0;

    for (let start = 1; start <= 30; start += resultsPerPage) {
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}&num=${resultsPerPage}&start=${start}`;
        console.log(`Generated search URL: ${url}`);

        try {
            let response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let data = await response.json();
            let matches = data.items ? data.items.length : 0;
            totalMatches += matches;
        } catch (error) {
            console.error("Error fetching Google results:", error);
            return 0;
        }
    }

    return totalMatches;
}
