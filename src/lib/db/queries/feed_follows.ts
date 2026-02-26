import { and, eq } from "drizzle-orm";
import { db } from "../index.js";
import { feedFollows, feeds, users } from "../schema.js";

export async function createFeedFollow(userId: string, feedId: string) {
  const [newFF] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const [row] = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      userName: users.name,
      feedName: feeds.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.id, newFF.id));

  return row;
}

export async function getFeedFollowsForUser(userId: string) {
  const rows = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      userName: users.name,
      feedName: feeds.name,
      feedUrl: feeds.url,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId));

  return rows;
}

export async function deleteFeedFollowByUserAndFeedUrl(userId: string, feedUrl: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, feedUrl));
  if (!feed) {
    throw new Error("Feed does not exist");
  }

  await db
    .delete(feedFollows)
    .where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feed.id)));
}
