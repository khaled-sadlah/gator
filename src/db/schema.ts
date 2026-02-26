import { pgTable, timestamp, uuid, text, uniqueIndex } from "drizzle-orm/pg-core";

export const feeds = pgTable(
  "feeds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdateNow(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    urlUnique: uniqueIndex("feeds_url_unique").on(table.url),
  })
);

export type Feed = typeof feeds.$inferSelect;
