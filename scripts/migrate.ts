import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const url = process.env.DATABASE_URL ?? "file:./demo.db";
const filename = path.resolve("prisma", url.replace(/^file:/, ""));
fs.mkdirSync(path.dirname(filename), { recursive: true });
const sqlite = new DatabaseSync(filename);
sqlite.exec(
  "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS _rips_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);",
);
for (const name of fs
  .readdirSync("prisma/migrations")
  .filter((n) => fs.statSync(`prisma/migrations/${n}`).isDirectory())
  .sort()) {
  const sql = fs.readFileSync(
    `prisma/migrations/${name}/migration.sql`,
    "utf8",
  );
  const checksum = createHash("sha256").update(sql).digest("hex");
  const old = sqlite
    .prepare("SELECT checksum FROM _rips_migrations WHERE name = ?")
    .get(name);
  if (old) {
    if (old.checksum !== checksum)
      throw new Error(`Applied migration ${name} was modified.`);
    continue;
  }
  try {
    sqlite.exec("BEGIN IMMEDIATE");
    sqlite.exec(sql);
    sqlite
      .prepare("INSERT INTO _rips_migrations (name, checksum) VALUES (?, ?)")
      .run(name, checksum);
    sqlite.exec("COMMIT");
    console.log(`Applied ${name}`);
  } catch (e) {
    sqlite.exec("ROLLBACK");
    throw e;
  }
}
sqlite.close();
console.log(`SQLite migrations up to date: ${filename}`);
