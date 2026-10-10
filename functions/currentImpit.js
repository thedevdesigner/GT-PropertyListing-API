import { Impit } from "impit";
import { getRandomProxy, proxyList } from "../utils/proxyclient.js";
const currentImpit = new Impit({
  browser: "firefox",
  proxyUrl: getRandomProxy(proxyList),
  ignoreTlsErrors: true,
});
export { currentImpit };
