import { getGenerators } from "@prisma/internals";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
async function main() {
  const generators = await getGenerators({
    schemaPath: "prisma/schema.prisma",
    registry: {
      "prisma-client-js": {
        type: "rpc",
        generatorPath: require.resolve("@prisma/client/generator-build"),
        isNode: true,
      },
    },
    skipDownload: true,
  });
  try {
    for (const generator of generators) await generator.generate();
  } finally {
    for (const generator of generators) generator.stop();
  }
  console.log(
    "Generated engine-free Prisma client (validated schema via Prisma WASM).",
  );
}
main();
