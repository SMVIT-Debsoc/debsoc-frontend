import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Repository-local agent tooling is not application source and is not part
    // of the production or CI frontend lint surface.
    ".agent/**",
    // Compatibility-only ambient Prisma declarations cover legacy model names
    // absent from the generated client; application source remains linted.
    "types/prisma-client.d.ts",
  ]),
]);

export default eslintConfig;
