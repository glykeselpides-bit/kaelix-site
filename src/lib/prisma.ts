import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        // Times are stored as UTC by the bot. Pin the session to UTC so dates the website saves or
        // filters on can't be shifted by the database server's own time zone setting.
        options: "-c timezone=UTC",
      }),
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
