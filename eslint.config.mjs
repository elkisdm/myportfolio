export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".astro/**",
    ],
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
