import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const followUps = sqliteTable("follow_ups", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  price: text("price").default("POA"),
  location: text("location").default("UK"),
  phone: text("phone").default(""),
  url: text("url").default(""),
  imageUrl: text("image_url").default(""),
  status: text("status", { enum: ["pending", "contacted", "converted", "rejected"] }).default("pending"),
  attempts: integer("attempts").default(0),
  notes: text("notes").default(""),
  // Added default fn fallback so Drizzle never sends null
  dateAdded: text("date_added").notNull().$defaultFn(() => new Date().toISOString()),
});