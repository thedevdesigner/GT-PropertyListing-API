import dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_DATABASE_AUTH,
  },
};