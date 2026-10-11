# Gator 🐊

Gator is a CLI-based RSS feed aggregator built with TypeScript and PostgreSQL.

It allows users to:

- Register and log in
- Add RSS feeds
- Follow and unfollow feeds
- Aggregate feeds
- Store posts in a PostgreSQL database
- Browse posts directly from the terminal

---

## Requirements

- Node.js (v18+)
- PostgreSQL
- npm

---

## Installation

Install dependencies:

```bash
npm install
```

Create the database:

```bash
sudo -u postgres createdb gator
```

Set the environment variable:

```bash
export DB_URL="postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
```

Run migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Configuration

Create a config file in your home directory:

nano ~/.gatorconfig.json

Add the following:

{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
}

Save and exit.

## Running the CLI

```bash
npm run start <command>
```

## Available Commands

Register a user:

npm run start register <username>

Login:

npm run start login <username>

Add a feed:

npm run start addfeed "<feed name>" "<feed url>"

Follow a feed:

npm run start follow "<feed url>"

Unfollow a feed:

npm run start unfollow "<feed url>"

List followed feeds:

npm run start following

Aggregate feeds:

npm run start agg 30s

Browse latest posts:

npm run start browse

Browse with limit:

npm run start browse 10
## Database Tables

users

feeds

feed_follows

posts

Posts are stored with unique URLs to prevent duplication.

## Project context

This project is for educational purposes.


---

