import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "storybook-static/",
      ".playwright-mcp/",
      "build/",
      "node_modules/",
      ".react-router/",
      ".agents/",
      ".claude/",
      "*-graphql-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ...react.configs.flat.recommended,
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...react.configs.flat["jsx-runtime"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": "off",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Нові HTML-атрибути (Invoker Commands, light dismiss у <dialog>), яких ще немає у списку плагіна.
      "react/no-unknown-property": ["error", { ignore: ["closedby", "command", "commandfor"] }],
      // role="list" на <ul> потрібен Safari/VoiceOver, коли в списку прибрано маркери.
      "jsx-a11y/no-redundant-roles": ["error", { ul: ["list"], ol: ["list"] }],
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    // Тести офіційного шаблону Hydrogen лишаються як є, тому для них частина правил м'якша.
    files: ["__test__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
      "no-empty-pattern": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    files: ["*.{js,mjs,ts}", "scripts/**/*.{js,mjs,ts}", "__test__/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
