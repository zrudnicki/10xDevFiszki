/**
 * Simple script to fetch content from lektury.gov.pl
 * Run with: node fetch-lektury.js
 */

async function fetchLektury() {
  try {
    const response = await fetch("https://lektury.gov.pl/", {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.text();

    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers));
    console.log("\nFirst 500 characters of body:");
    console.log(body.substring(0, 500));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// In Node.js environment, we need to use fetch from node-fetch package
// or use the global fetch if running Node.js 18+
if (!globalThis.fetch) {
  console.error("Please run this script with Node.js 18+ or install node-fetch package");
  process.exit(1);
}

fetchLektury();
