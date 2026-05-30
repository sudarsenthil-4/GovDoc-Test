import next from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const config = [
  { ignores: [".next/**", ".worktrees/**", "node_modules/**", "dist/**"] },
  ...next,
  prettier,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }],
    },
  },
];

export default config;
