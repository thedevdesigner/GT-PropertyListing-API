import * as cheerio from "cheerio";

/**
 * Extracts and parses URI-encoded window.clientData payloads from Gumtree HTML.
 * @param {string} html - Raw HTML string fetched from a listing
 * @returns {object|null} Fully parsed clientData object or null
 */
export function extractGumtreeClientData(html) {
  if (!html || typeof html !== "string") return null;

  const $ = cheerio.load(html);
  let parsedData = null;

  $("script").each((_, element) => {
    if (parsedData) return false; // Exit early if already found

    const scriptText = $(element).html();
    if (!scriptText || !scriptText.includes("window.clientData")) return;

    try {
      const marker = "window.clientData =";
      const keyIndex = scriptText.indexOf(marker);
      if (keyIndex === -1) return;

      const equalsIndex = scriptText.indexOf("=", keyIndex);
      if (equalsIndex === -1) return;

      // Find the opening quote of the encoded string
      let quoteChar = "";
      let quoteIndex = equalsIndex + 1;
      while (quoteIndex < scriptText.length) {
        const char = scriptText[quoteIndex];
        if (char === '"' || char === "'") {
          quoteChar = char;
          break;
        }
        quoteIndex++;
      }

      if (!quoteChar) return;

      const contentStart = quoteIndex + 1;
      const contentEnd = scriptText.indexOf(quoteChar, contentStart);
      if (contentEnd === -1) return;

      // Slice the exact encoded string (e.g., %7B%22request%22...)
      const encodedString = scriptText.slice(contentStart, contentEnd);

      // Decode URI and parse JSON safely
      const decodedString = decodeURIComponent(encodedString);
      parsedData = JSON.parse(decodedString);

      if (parsedData) return false; // Break Cheerio loop
    } catch (err) {
      console.error("[Parser Error] Failed to decode/parse clientData string:", err.message);
    }
  });

  return parsedData;
}

/**
 * Extracts the contact name from the decoded clientData structure
 * @param {string} html - Raw HTML string
 * @returns {string} Contact name or empty string
 */
export function extractGumtreeContactName(html) {
  const clientData = extractGumtreeClientData(html);
  
  // Based on your payload schema: sellerContactDetails.contactName
  const contactName = clientData?.sellerContactDetails?.contactName || "";
  return contactName.trim();
}