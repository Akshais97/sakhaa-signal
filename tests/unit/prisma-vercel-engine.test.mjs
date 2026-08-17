import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");

test("both Prisma entry schemas generate the Vercel Linux query engine", () => {
  for (const schema of ["prisma/schema.prisma", "packages/db/prisma/schema.prisma"]) {
    assert.match(
      read(schema),
      /binaryTargets\s*=\s*\[\s*"native"\s*,\s*"rhel-openssl-3\.0\.x"\s*\]/,
      schema,
    );
  }
});

test("Next.js traces the generated Prisma Linux engine from the monorepo package", () => {
  const config = read("apps/web/next.config.ts");
  assert.match(config, /outputFileTracingRoot/);
  assert.match(config, /path\.join\(import\.meta\.dirname,\s*"\.\.\/\.\."\)/);
  assert.match(
    config,
    /\.\.\/\.\.\/packages\/db\/generated\/client\/libquery_engine-\*\.so\.node/,
  );
  assert.match(config, /\.\.\/\.\.\/packages\/db\/generated\/client\/schema\.prisma/);
});

test("web builds fail closed when the Prisma engine is absent from route manifests", () => {
  const packageJson = JSON.parse(read("apps/web/package.json"));
  assert.match(packageJson.scripts.build, /verify-vercel-prisma-engine\.mjs/);

  const verifier = read("scripts/verify-vercel-prisma-engine.mjs");
  assert.match(verifier, /libquery_engine-rhel-openssl-3\.0\.x\.so\.node/);
  assert.match(verifier, /PRISMA_ENGINE_MISSING/);
  assert.match(verifier, /PRISMA_ENGINE_NOT_TRACED/);
  assert.match(verifier, /api\/uploads\/presign/);
  assert.match(verifier, /api\/workspaces/);
});

test("root generation runs Prisma from the database workspace package", () => {
  const generator = read("packages/db/scripts/db-generate.mjs");
  assert.match(generator, /const dbPackageDir/);
  assert.match(generator, /cwd:\s*dbPackageDir/);
  assert.match(generator, /resolve\(dbPackageDir,\s*"prisma\/schema\.prisma"\)/);
});
