import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const res = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!res.ok) {
    throw new Error(`failed to fetch feed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error("invalid RSS feed: missing channel");
  }

  const title = channel.title;
  const link = channel.link;
  const description = channel.description;

  if (
    typeof title !== "string" ||
    typeof link !== "string" ||
    typeof description !== "string"
  ) {
    throw new Error("invalid RSS feed: missing metadata fields");
  }

  let itemsRaw: any[] = [];
  if (channel.item) {
    itemsRaw = Array.isArray(channel.item) ? channel.item : [channel.item];
  }

  const items: RSSItem[] = [];
  for (const it of itemsRaw) {
    const t = it?.title;
    const l = it?.link;
    const d = it?.description;
    const p = it?.pubDate;

    if (
      typeof t !== "string" ||
      typeof l !== "string" ||
      typeof d !== "string" ||
      typeof p !== "string"
    ) {
      continue;
    }

    items.push({
      title: t,
      link: l,
      description: d,
      pubDate: p,
    });
  }

  return {
    channel: {
      title,
      link,
      description,
      item: items,
    },
  };
}
