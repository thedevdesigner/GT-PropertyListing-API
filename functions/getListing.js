import { currentImpit } from "./currentImpit.js";
import * as cheerio from "cheerio";
import { fetchContactNameForUrl } from "./fetchContactName.js";
import { promise } from "zod";
export async function getGumTreeListing(req) {
  let url;
  if (req.method == "GET") {
    url = `https://www.gumtree.com/search?search_category=property-to-rent&search_location=london&distance=5&seller_type=private&sort=date`;
  }

  if (req.method == "POST") {
    const pageParam = req.body?.page > 1 ? `page=${req.body.page}&` : "";
    url = `https://www.gumtree.com/search?search_category=property-to-rent&search_location=london&${pageParam}distance=5&seller_type=private&sort=date`;
  }

  const maxRetries = 5;
  let clientData = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${maxRetries}] Fetching URL...`);
      const response = await currentImpit.fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      clientData = null;

      // 2. Extract and decode massive window.clientData with deep error tracing
      $("script").each((index, element) => {
        const scriptText = $(element).html();

        if (scriptText && scriptText.includes("window.clientData")) {
          try {
            const targetKey = "window.clientData";
            const keyIndex = scriptText.indexOf(targetKey);

            if (keyIndex !== -1) {
              const equalsIndex = scriptText.indexOf("=", keyIndex);
              if (equalsIndex !== -1) {
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

                if (quoteChar) {
                  const contentStart = quoteIndex + 1;
                  const contentEnd = scriptText.indexOf(
                    quoteChar,
                    contentStart,
                  );

                  if (contentEnd !== -1) {
                    const encodedString = scriptText.slice(
                      contentStart,
                      contentEnd,
                    );
                    console.log(
                      `[Parser] Sliced encoded string. Length: ${encodedString.length} chars`,
                    );

                    try {
                      // 1. Test decoding
                      const decodedString = decodeURIComponent(encodedString);
                      console.log(
                        `[Parser] Successfully decoded URI component.`,
                      );

                      // 2. Test parsing
                      clientData = JSON.parse(decodedString);
                      console.log(
                        `[Parser] Successfully parsed JSON! clientData keys:`,
                        Object.keys(clientData),
                      );

                      if (clientData) {
                        return false; // Break out of the .each() loop successfully
                      }
                    } catch (innerErr) {
                      console.error(
                        `[Parser Error] Failed during decode/parse:`,
                        innerErr.message,
                      );
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
        console.log(
          `[Attempt ${attempt}] Successfully extracted clientData and search ads!`,
        );
        break;
      }

      console.warn(
        `[Attempt ${attempt}] Required window.clientData missing or invalid. Retrying...`,
      );
    } catch (err) {
      console.error(`[Attempt ${attempt}] Error encountered: ${err.message}`);
    }

    // 4. Exponential backoff before proxy retry
    if (attempt < maxRetries) {
      const waitTime = 2000 * attempt;
      console.log(`Waiting ${waitTime}ms before trying a new proxy...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Guardrail: Check if data requested is available and return graceful response
  const searchAds = clientData?.resultsPage?.searchAds;

  if (!searchAds || !Array.isArray(searchAds) || searchAds.length === 0) {
    return {
      success: false,
      message:
        "Failed to extract listing data or no listings found after maximum retries.",
      data: [],
      pagination: { numberOfPages: 0, currentPage: 1 },
    };
  }
  // get customer name
  const gn = async (url) => {
    return await fetchContactNameForUrl(url);
  };

  // Map and fetch customer names concurrently
  const formattedListings = await Promise.all(
    searchAds.map(async (ad) => {
      const listingUrl = `https://www.gumtree.com${ad?.path ?? ""}`;

      // Await the asynchronous fetch and extraction for each individual URL
      const customerName = listingUrl.includes("gumtree.com")
        ? await fetchContactNameForUrl(listingUrl)
        : "";

      return {
        title: ad?.title ?? null,
        imageIds: ad?.imageIds ?? [],
        imageUrl: ad?.imageUrl ?? null,
        shortDescription: ad?.shortDescription ?? null,
        location: ad?.location ?? null,
        price: ad?.price ?? null,
        date: ad?.date ?? null,
        url: listingUrl,
        customerName: customerName,
        srpContactDetail: {
          replyPhone: ad?.srpContactDetail?.replyPhone ?? null,
        },
      };
    }),
  );
  const paginationInfo = {
    numberOfPages: clientData?.resultsPage?.adsPagination?.numberOfPages ?? 1,
    currentPage: clientData?.resultsPage?.adsPagination?.currentPage ?? 1,
  };

  return {
    success: true,
    message: "Listings extracted successfully.",
    data: formattedListings,
    pagination: paginationInfo,
  };
}

export async function getRightMoveListing(req) {
  let url;
  console.log(req.body);

  if (req.method === "GET") {
    const location = req.query?.location || "London";
    const regionId = req.query?.regionId || "REGION^87490";
    const sinceAdded = req.query?.sinceAdded || "14";
    const pagination = req.query?.pagination || "0";

    url = `https://www.rightmove.co.uk/api/property-search/listing/search?searchLocation=${encodeURIComponent(location)}&useLocationIdentifier=true&locationIdentifier=${encodeURIComponent(regionId)}&radius=1.0&_includeLetAgreed=on&maxDaysSinceAdded=${sinceAdded}&index=${pagination}&sortType=6&channel=RENT&transactionType=LETTING`;
  } else if (req.method === "POST") {
    const location = req.body?.location || "London";
    const regionId = req.body?.regionId || "REGION^87490";
    const sinceAdded = req.body?.sinceAdded || "14";
    const pagination = req.body?.pagination || "0";

    url = `https://www.rightmove.co.uk/api/property-search/listing/search?searchLocation=${encodeURIComponent(location)}&useLocationIdentifier=true&locationIdentifier=${encodeURIComponent(regionId)}&radius=1.0&_includeLetAgreed=on&maxDaysSinceAdded=${sinceAdded}&index=${pagination}&sortType=6&channel=RENT&transactionType=LETTING`;
  } else {
    return {
      success: false,
      message: "Unsupported request method.",
      data: [],
      pagination: {
        total: 0,
        options: [],
        first: "0",
        last: "0",
        next: "0",
        page: "1",
      },
    };
  }

  const maxRetries = 5;
  let responseData = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[RightMove Attempt ${attempt}/${maxRetries}] Fetching API URL...`,
      );
      const fetchData = await currentImpit.fetch(url);

      if (!fetchData.ok) {
        throw new Error(`HTTP error! status: ${fetchData.status}`);
      }

      responseData = await fetchData.json();

      if (responseData && Array.isArray(responseData.properties)) {
        console.log(
          `[RightMove Attempt ${attempt}] Successfully fetched and parsed properties! Count: ${responseData.properties.length}`,
        );
        break;
      }

      console.warn(
        `[RightMove Attempt ${attempt}] Response missing 'properties' array. Retrying...`,
      );
    } catch (err) {
      console.error(
        `[RightMove Attempt ${attempt}] Error encountered: ${err.message}`,
      );
    }

    if (attempt < maxRetries) {
      const waitTime = 2000 * attempt;
      console.log(
        `Waiting ${waitTime}ms before trying a new proxy rotation...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  const properties = responseData?.properties;

  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    return {
      success: false,
      message:
        "Failed to extract RightMove listings or no properties found after maximum retries.",
      data: [],
      pagination: responseData?.pagination ?? {
        total: 0,
        options: [],
        first: "0",
        last: "0",
        next: "0",
        page: "1",
      },
    };
  }

  const formattedProperties = properties.map((property) => ({
    summary: property?.summary ?? null,
    displayAddress: property?.displayAddress ?? null,
    images: property?.images ?? [],
    propertySubType: property?.propertySubType ?? null,
    listingUpdate: property?.listingUpdate ?? null,
    price: property?.price ?? null,
    customerName: property?.customer?.branchDisplayName ?? null,
    propertyUrl: property?.propertyUrl
      ? `https://www.rightmove.co.uk${property.propertyUrl}`
      : null,
    phone: property?.customer?.contactTelephone ?? "",
  }));

  const paginationInfo = responseData?.pagination ?? {
    total: 0,
    options: [],
    first: "0",
    last: "0",
    next: "0",
    page: "1",
  };

  return {
    success: true,
    message: "Listings extracted successfully.",
    data: formattedProperties,
    pagination: paginationInfo,
  };
}
