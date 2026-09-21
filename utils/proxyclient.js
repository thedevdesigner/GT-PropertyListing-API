import dotenv  from "dotenv";
dotenv.config()
export const proxyList = [
`http://${process.env.COROXY_USERNAME}:${process.env.COPROXY_PASSWORD}@107.149.32.82:16967`,
`http://${process.env.COROXY_USERNAME}:${process.env.COPROXY_PASSWORD}@107.149.32.83:27203`,
`http://${process.env.COROXY_USERNAME}:${process.env.COPROXY_PASSWORD}@107.149.32.81:17202`,
`http://${process.env.COROXY_USERNAME}:${process.env.COPROXY_PASSWORD}@107.149.32.80:18692`,
`http://${process.env.COROXY_USERNAME}:${process.env.COPROXY_PASSWORD}@107.149.32.84:17698`,

]

// 2. Closure function to handle IP rotation
export function getRandomProxy(proxies) {
    if (!Array.isArray(proxies) || proxies.length === 0) {
        throw new Error("Proxy array must not be empty or invalid.");
    }
    const randomIndex = Math.floor(Math.random() * proxies.length); 
    return proxies[randomIndex];
}

