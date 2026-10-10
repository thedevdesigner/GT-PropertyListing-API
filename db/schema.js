import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const followUps = sqliteTable("follow_ups", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  price: text("price").default("POA"),
  location: text("location").default("UK"),
  phone: text("phone").default(""),
  url: text("url").default(""),
  imageUrl: text("image_url").default(""),
  customerName: text("contact_name").default(""), // Added seller/agent contact name field
  status: text("status", { 
    enum: [
      "pending", 
      "no_answer", 
      "callback", 
      "sa_pending", 
      "sa_allowed", 
      "viewing_booked", 
      "rejected", 
      "not_interested"
    ] 
  }).default("pending"),
  attempts: integer("attempts").default(0),
  notes: text("notes").default(""),
  dateAdded: text("date_added").notNull().$defaultFn(() => new Date().toISOString()),
});