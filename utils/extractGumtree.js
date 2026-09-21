// Helper function to safely extract the JavaScript data layer
export function extractGumtreeData(scriptText) {
  const marker = 'window.gumtreeDataLayer =';
  const startIndex = scriptText.indexOf(marker);
  if (startIndex === -1) return null;
  
  const openBracketIndex = scriptText.indexOf('[', startIndex);
  if (openBracketIndex === -1) return null;

  let bracketCount = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = openBracketIndex; i < scriptText.length; i++) {
    const char = scriptText[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (inString) {
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        const rawJsonString = scriptText.substring(openBracketIndex, i + 1);
        return new Function(`return ${rawJsonString};`)();
      }
    }
  }
  return null;
}

export function extractLdJsonData($) {
  let searchResultsSchema = null;
  
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const scriptContent = $(element).html();
      if (scriptContent) {
        const parsed = JSON.parse(scriptContent);
        // Look for the SearchResultsPage schema block
        if (parsed['@type'] === 'SearchResultsPage' || (parsed.mainEntity && parsed.mainEntity['@type'] === 'ItemList')) {
          searchResultsSchema = parsed;
          return false; // Break cheerio each loop
        }
      }
    } catch (e) {
      // Ignore invalid JSON blocks in other script tags
    }
  });

  return searchResultsSchema;
}