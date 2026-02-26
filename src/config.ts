import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

const CONFIG_PATH = path.join(os.homedir(), ".gatorconfig.json");

function parseConfig(raw: unknown): Config {
  if (!raw || typeof raw !== "object") {
    throw new Error("invalid config file");
  }

  const obj = raw as Record<string, unknown>;

  const dbUrl =
    (typeof obj.dbUrl === "string" ? obj.dbUrl : undefined) ??
    (typeof obj.db_url === "string" ? obj.db_url : undefined);

  if (!dbUrl) {
    throw new Error("dbUrl missing from config");
  }

  const currentUserName =
    (typeof obj.currentUserName === "string" ? obj.currentUserName : undefined) ??
    (typeof obj.current_user_name === "string" ? obj.current_user_name : undefined);

  return { dbUrl, currentUserName };
}

export function readConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`config file not found at ${CONFIG_PATH}`);
  }
  const txt = fs.readFileSync(CONFIG_PATH, "utf-8");
  const raw = JSON.parse(txt);
  return parseConfig(raw);
}

export function writeConfig(cfg: Config): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function setUser(userName: string): void {
  const cfg = readConfig();
  writeConfig({ ...cfg, currentUserName: userName });
}
