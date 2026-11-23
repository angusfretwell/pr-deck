import tailwindcssPlugin from "@tailwindcss/vite";
import reactPlugin from "@vitejs/plugin-react";
import ultracite from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import landmines from "ultracite/oxlint/landmines";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: { "@": new URL("src", import.meta.url).pathname },
  },
  server: { port: 5183 },
  fmt: {
    ...ultracite,
    ignorePatterns: [
      ".claude/skills/**",
      "skills-lock.json",
      "src/github/graphql.generated.ts",
    ],
  },
  lint: {
    env: core.env,
    extends: [core, react, tanstack, landmines, antiSlop],
    ignorePatterns: core.ignorePatterns,
    jsPlugins: [
      ...landmines.jsPlugins,
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
    ],
    options: { typeAware: true },
    rules: {
      "eslint/func-style": ["error", "declaration"],
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
  plugins: lazyPlugins(() => [reactPlugin(), tailwindcssPlugin()]),
});
