import {
  registerCommand,
  runCommand,
  middlewareLoggedIn,
  handlerAgg,
  handlerLogin,
  handlerRegister,
  handlerUsers,
  handlerReset,
  handlerAddFeed,
  handlerFeeds,
  handlerFollow,
  handlerFollowing,
  handlerUnfollow,
  handlerBrowse,
} from "./commands.js";

import { client } from "./lib/db/index.js";

async function main() {
  const args = process.argv.slice(2);
  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  if (!cmdName) {
    throw new Error("No command provided");
  }

  const registry = {};

  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "reset", handlerReset);

  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
