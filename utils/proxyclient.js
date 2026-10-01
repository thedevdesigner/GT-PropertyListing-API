import dotenv  from "dotenv";
dotenv.config()
// FREE PROXIES FROM GEONODE
export const proxyList = [
`http://${process.env.GEONODE_USERNAME}:${process.env.GEONODE_PASSWORD}@proxy.geonode.io:${process.env.PORT}`]
// 2. Closure function to handle IP rotation
export function getRandomProxy(proxies) {
    if (!Array.isArray(proxies) || proxies.length === 0) {
        throw new Error("Proxy array must not be empty or invalid.");
    }
    const randomIndex = Math.floor(Math.random() * proxies.length); 
    return proxies[randomIndex];
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

