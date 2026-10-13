import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "eslint-config-next";

const eslintConfig = defineConfig([
  ...(Array.isArray(nextPlugin) ? nextPlugin : [nextPlugin]),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

