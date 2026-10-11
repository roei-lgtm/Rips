import { getDMMF } from "@prisma/internals";
import fs from "node:fs";
async function main() {
  const dmmf = await getDMMF({
    datamodel: fs.readFileSync("prisma/schema.prisma", "utf8"),
  });
  const sql = ["PRAGMA foreign_keys = ON;"];
  for (const m of dmmf.datamodel.models) {
    const fields = m.fields.filter((f) => f.kind !== "object");
    const cols = fields.map((f) => {
      let s = `"${f.name}" ${f.type === "Int" || f.type === "Boolean" ? "INTEGER" : f.type === "DateTime" ? "DATETIME" : "TEXT"}`;
      if (f.isRequired) s += " NOT NULL";
      if (f.isId) s += " PRIMARY KEY";
      if (f.hasDefaultValue) {
        const d = f.default;
        if (typeof d === "string") s += ` DEFAULT '${d.replaceAll("'", "''")}'`;
        else if (typeof d === "number") s += ` DEFAULT ${d}`;
        else if (typeof d === "boolean") s += ` DEFAULT ${d ? 1 : 0}`;
        else if (typeof d === "object" && d && "name" in d && d.name === "now")
          s += " DEFAULT CURRENT_TIMESTAMP";
      }
      return s;
    });
    for (const f of m.fields.filter(
      (f) => f.kind === "object" && f.relationFromFields?.length,
    )) {
      cols.push(
        `FOREIGN KEY (${f.relationFromFields!.map((v) => `"${v}"`).join(", ")}) REFERENCES "${f.type}" (${f.relationToFields!.map((v) => `"${v}"`).join(", ")}) ON DELETE ${f.isRequired ? "RESTRICT" : "SET NULL"} ON UPDATE CASCADE`,
      );
    }
    sql.push(`CREATE TABLE "${m.name}" (\n  ${cols.join(",\n  ")}\n);`);
    for (const f of fields.filter((f) => f.isUnique))
      sql.push(
        `CREATE UNIQUE INDEX "${m.name}_${f.name}_key" ON "${m.name}"("${f.name}");`,
      );
    for (const group of m.uniqueFields)
      sql.push(
        `CREATE UNIQUE INDEX "${m.name}_${group.join("_")}_key" ON "${m.name}"(${group.map((f) => `"${f}"`).join(", ")});`,
      );
  }
  fs.mkdirSync("prisma/migrations/20261011000000_init", { recursive: true });
  fs.writeFileSync(
    "prisma/migrations/20261011000000_init/migration.sql",
    sql.join("\n\n"),
  );
  fs.writeFileSync(
    "prisma/migrations/migration_lock.toml",
    'provider = "sqlite"\n',
  );
}
main();
