import { extractGumtreeContactName } from "../utils/extractGumtreeContactName.js";
import { currentImpit } from "./currentImpit.js";

export async function fetchContactNameForUrl(url) {
  try {
    if (!url || !url.includes("gumtree.com")) return "";
    const response = await currentImpit.fetch(url);
    const html = await response.text();
    return extractGumtreeContactName(html);
  } catch (err) {
    console.warn("Failed to fetch listing HTML for contact extraction:", err)
    return "";
  }
}