import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readConfig } from "../../config.js";

const cfg = readConfig();

export const client = postgres(cfg.dbUrl, { max: 1 });
export const db = drizzle(client);
