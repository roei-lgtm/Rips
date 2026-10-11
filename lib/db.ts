import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import path from "node:path";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const database = process.env.DATABASE_URL ?? "file:./demo.db";
const url = `file:${path.resolve("prisma", database.replace(/^file:/, ""))}`;
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaLibSQL({ url }) });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
