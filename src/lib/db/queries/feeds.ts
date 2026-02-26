import { asc, eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { feeds, users } from "../schema.js";

export async function createFeed(name: string, url: string, userId: string) {
  const [row] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return row;
}

export async function getFeedByUrl(url: string) {
  const [row] = await db.select().from(feeds).where(eq(feeds.url, url));
  return row;
}

export async function getFeeds() {
  const rows = await db
    .select({
      feedName: feeds.name,
      feedUrl: feeds.url,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id))
    .orderBy(asc(feeds.createdAt));
  return rows;
}

export async function markFeedFetched(feedId: string): Promise<void> {
  const now = new Date();
  await db
    .update(feeds)
    .set({ lastFetchedAt: now, updatedAt: now })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const rows = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} asc nulls first`, asc(feeds.createdAt))
    .limit(1);

  return rows[0];
}
