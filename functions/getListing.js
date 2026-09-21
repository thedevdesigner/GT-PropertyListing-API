import { Impit } from "impit";
import { proxyList, getRandomProxy } from "../utils/proxyclient.js";
import * as cheerio from "cheerio";

export async function getGumTreeListing(req) {
  let url;
  if (req.method == "GET") {
    url = `https://www.gumtree.com/search?search_category=property-to-rent&search_location=london&distance=5&seller_type=private&sort=date`;
  }
  
  if (req.method == "POST") {
    const pageParam = req.body?.page > 1 ? `page=${req.body.page}&` : "";
    url = `https://www.gumtree.com/search?search_category=property-to-rent&search_location=london&${pageParam}distance=5&seller_type=private&sort=date`;
  }
  
  const maxRetries = 3;
  let clientData = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. Fresh proxy instance per attempt
      const currentImpit = new Impit({
        browser: "firefox",
        proxyUrl: getRandomProxy(proxyList),
        ignoreTlsErrors: true,
      });

      console.log(`[Attempt ${attempt}/${maxRetries}] Fetching URL...`);
      const response = await currentImpit.fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      clientData = null;

// 2. Extract and decode massive window.clientData with deep error tracing
      $('script').each((index, element) => {
        const scriptText = $(element).html();
        
        if (scriptText && scriptText.includes('window.clientData')) {
          try {
            const targetKey = 'window.clientData';
            const keyIndex = scriptText.indexOf(targetKey);
            
            if (keyIndex !== -1) {
              const equalsIndex = scriptText.indexOf('=', keyIndex);
              if (equalsIndex !== -1) {
                
                let quoteChar = '';
                let quoteIndex = equalsIndex + 1;
                while (quoteIndex < scriptText.length) {
                  const char = scriptText[quoteIndex];
                  if (char === '"' || char === "'") {
                    quoteChar = char;
                    break;
                  }
                  quoteIndex++;
                }

                if (quoteChar) {
                  const contentStart = quoteIndex + 1;
                  const contentEnd = scriptText.indexOf(quoteChar, contentStart);
                  
                  if (contentEnd !== -1) {
                    const encodedString = scriptText.slice(contentStart, contentEnd);
                    console.log(`[Parser] Sliced encoded string. Length: ${encodedString.length} chars`);
                    
                    try {
                      // 1. Test decoding
                      const decodedString = decodeURIComponent(encodedString);
                      console.log(`[Parser] Successfully decoded URI component.`);
                      
                      // 2. Test parsing
                      clientData = JSON.parse(decodedString);
                      console.log(`[Parser] Successfully parsed JSON! clientData keys:`, Object.keys(clientData));
                      
                      if (clientData) {
                        return false; // Break out of the .each() loop successfully
                      }
                    } catch (innerErr) {
                      console.error(`[Parser Error] Failed during decode/parse:`, innerErr.message);
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error navigating script text structure:", e.message);
          }
        }
      });      

      // 3. Validation: Success if clientData and searchAds exist
      if (clientData?.resultsPage?.searchAds) {
        console.log(`[Attempt ${attempt}] Successfully extracted clientData and search ads!`);
        break; 
      }

      console.warn(`[Attempt ${attempt}] Required window.clientData missing or invalid. Retrying...`);

    } catch (err) {
      console.error(`[Attempt ${attempt}] Error encountered: ${err.message}`);
    }

    // 4. Exponential backoff before proxy retry
    if (attempt < maxRetries) {
      const waitTime = 2000 * attempt;
      console.log(`Waiting ${waitTime}ms before trying a new proxy...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // Guardrail: Check if data requested is available and return graceful response
  const searchAds = clientData?.resultsPage?.searchAds;
  
  if (!searchAds || !Array.isArray(searchAds) || searchAds.length === 0) {
    return {
      success: false,
      message: "Failed to extract listing data or no listings found after maximum retries.",
      data: [],
      pagination: { numberOfPages: 0, currentPage: 1 }
    };
  }

  // Map and clean up the extracted listings to match your requested fields
  const formattedListings = searchAds.map(ad => ({
    title: ad?.title ?? null,
    imageIds: ad?.imageIds ?? [],
    imageUrl: ad?.imageUrl ?? null,
    shortDescription: ad?.shortDescription ?? null,
    location: ad?.location ?? null,
    price: ad?.price ?? null,
    date: ad?.date ?? null,
    url:`https://gumtree.com${ad?.path??null}`,
    srpContactDetail: {
      replyPhone: ad?.srpContactDetail?.replyPhone ?? null
    }
  }));

  const paginationInfo = {
    numberOfPages: clientData?.resultsPage?.adsPagination?.numberOfPages ?? 1,
    currentPage: clientData?.resultsPage?.adsPagination?.currentPage ?? 1
  };

  return {
    success: true,
    message: "Listings extracted successfully.",
    data: formattedListings,
    pagination: paginationInfo
  };
}