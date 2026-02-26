import { readConfig, setUser } from "./config.js";
import { fetchFeed } from "./rss.js";
import type { Feed, User } from "./lib/db/schema.js";

import { createUser, getUserByName, getUsers, resetUsers } from "./lib/db/queries/users.js";
import { createFeed, getFeedByUrl, getFeeds, getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds.js";
import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollowByUserAndFeedUrl,
} from "./lib/db/queries/feed_follows.js";
import { createPost, getPostsForUser } from "./lib/db/queries/posts.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
export type CommandsRegistry = Record<string, CommandHandler>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export const middlewareLoggedIn: middlewareLoggedIn = (handler) => {
  return async (cmdName: string, ...args: string[]) => {
    const cfg = readConfig();
    const userName = cfg.currentUserName;
    if (!userName) {
      throw new Error("No current user");
    }
    const user = await getUserByName(userName);
    if (!user) {
      throw new Error(`User ${userName} not found`);
    }
    await handler(cmdName, user, ...args);
  };
};

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }
  await handler(cmdName, ...args);
}

export function printFeed(feed: Feed, user: User): void {
  console.log(`* ID: ${feed.id}`);
  console.log(`* Created: ${feed.createdAt}`);
  console.log(`* Updated: ${feed.updatedAt}`);
  console.log(`* Name: ${feed.name}`);
  console.log(`* URL: ${feed.url}`);
  console.log(`* User: ${user.name}`);
}

export function printFollow(userName: string, feedName: string): void {
  console.log(`${userName} follows ${feedName}`);
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) {
    throw new Error("Invalid duration format");
  }
  const n = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid duration value");
  }
  if (unit === "ms") return n;
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60 * 1000;
  return n * 60 * 60 * 1000;
}

function parsePublishedAt(raw: string | undefined): Date | null {
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

async function scrapeFeeds(): Promise<void> {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    return;
  }

  await markFeedFetched(feed.id);

  const fetched = await fetchFeed(feed.url);
  const items = fetched.channel.item ?? [];

  for (const it of items) {
    await createPost({
      title: it.title,
      url: it.link,
      description: it.description,
      publishedAt: parsePublishedAt(it.pubDate),
      feedId: feed.id,
    });
  }
}

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("time_between_reqs is required");
  }

  const timeBetweenReqsStr = args[0];
  const timeBetweenRequests = parseDuration(timeBetweenReqsStr);

  const secs = Math.floor(timeBetweenRequests / 1000);
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;

  console.log(`Collecting feeds every ${mins}m${rem}s`);

  await scrapeFeeds();

  const interval = setInterval(() => {
    scrapeFeeds().catch((e) => {
      console.error(e instanceof Error ? e.message : e);
    });
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("Username is required");
  }
  const username = args[0];
  const user = await getUserByName(username);
  if (!user) {
    throw new Error("User does not exist");
  }
  setUser(username);
  console.log(`User set to ${username}`);
}

export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("Username is required");
  }

  const username = args[0];

  const existing = await getUserByName(username);
  if (existing) {
    throw new Error("User already exists");
  }

  await createUser(username);
  setUser(username);

  console.log(`User created: ${username}`);
}

export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  const cfg = readConfig();
  const current = cfg.currentUserName;
  const all = await getUsers();

  for (const u of all) {
    const suffix = current && u.name === current ? " (current)" : "";
    console.log(`* ${u.name}${suffix}`);
  }
}

export async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  await resetUsers();
  console.log("Database reset");
}

export const handlerAddFeed: UserCommandHandler = async (
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> => {
  if (args.length < 2) {
    throw new Error("Name and URL are required");
  }

  const [name, url] = args;

  const feed = await createFeed(name, url, user.id);
  printFeed(feed, user);

  const follow = await createFeedFollow(user.id, feed.id);
  printFollow(follow.userName, follow.feedName);
};

export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  const all = await getFeeds();
  for (const f of all) {
    console.log(`* ${f.feedName}`);
    console.log(`  - ${f.feedUrl}`);
    console.log(`  - added by ${f.userName}`);
  }
}

export const handlerFollow: UserCommandHandler = async (
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> => {
  if (args.length < 1) {
    throw new Error("URL is required");
  }

  const url = args[0];

  const feed = await getFeedByUrl(url);
  if (!feed) {
    throw new Error("Feed does not exist");
  }

  const follow = await createFeedFollow(user.id, feed.id);
  printFollow(follow.userName, follow.feedName);
};

export const handlerFollowing: UserCommandHandler = async (
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> => {
  const follows = await getFeedFollowsForUser(user.id);
  for (const f of follows) {
    console.log(`* ${f.feedName}`);
  }
};

export const handlerUnfollow: UserCommandHandler = async (
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> => {
  if (args.length < 1) {
    throw new Error("URL is required");
  }
  const url = args[0];
  await deleteFeedFollowByUserAndFeedUrl(user.id, url);
  console.log(`Unfollowed ${url}`);
};

export const handlerBrowse: UserCommandHandler = async (
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> => {
  const limitRaw = args[0];
  const limit = limitRaw ? Number(limitRaw) : 2;

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error("limit must be a positive number");
  }

  const rows = await getPostsForUser(user.id, Math.floor(limit));

  for (const r of rows) {
    console.log(`* ${r.feedName}`);
    console.log(`  - ${r.title}`);
    console.log(`  - ${r.url}`);
    if (r.publishedAt) {
      console.log(`  - ${r.publishedAt.toISOString()}`);
    }
    if (r.description) {
      console.log(`  - ${r.description}`);
    }
  }
};
