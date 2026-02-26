import { db } from "../index";
import { feeds } from "../schema";

export async function createFeed(name: string, url: string, userId: string) {
  const [feed] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return feed;
}
