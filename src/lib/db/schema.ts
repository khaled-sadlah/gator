import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  name: text("name").notNull().unique(),
});

export const feeds = pgTable("feeds", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: false }),
});

export const feedFollows = pgTable("feed_follows", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  feedId: uuid("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  publishedAt: timestamp("published_at", { withTimezone: false }),
  feedId: uuid("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  feeds: many(feeds),
  feedFollows: many(feedFollows),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  user: one(users, { fields: [feeds.userId], references: [users.id] }),
  feedFollows: many(feedFollows),
  posts: many(posts),
}));

export const feedFollowsRelations = relations(feedFollows, ({ one }) => ({
  user: one(users, { fields: [feedFollows.userId], references: [users.id] }),
  feed: one(feeds, { fields: [feedFollows.feedId], references: [feeds.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  feed: one(feeds, { fields: [posts.feedId], references: [feeds.id] }),
}));

export type User = typeof users.$inferSelect;
export type Feed = typeof feeds.$inferSelect;
export type FeedFollow = typeof feedFollows.$inferSelect;
export type Post = typeof posts.$inferSelect;
