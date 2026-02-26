import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { users, type User } from "../schema.js";

export async function createUser(name: string): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ name })
    .returning();
  return user;
}

export async function getUserByName(name: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.name, name));
  return user ?? null;
}

export async function getUsers(): Promise<User[]> {
  return db.select().from(users);
}

export async function resetUsers(): Promise<void> {
  await db.delete(users);
}
