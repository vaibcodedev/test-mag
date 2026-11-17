import { fileURLToPath } from "node:url";

import { reactRouter } from "@react-router/dev/vite";
import { localHttps } from "@shopify/hydrogen/vite";
import { oxygen } from "@shopify/mini-oxygen/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const oxygenPlugins = oxygen();
const enabled = process.env.npm_lifecycle_event === "dev:https";
const httpsOptions = { enabled };

export default defineConfig({
  plugins: [localHttps(httpsOptions), tailwindcss(), ...oxygenPlugins, reactRouter()],
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        // У режимі розробки Vite бере для `@shopify/hydrogen` збірку `development`, а в
        // `@shopify/hydrogen/customer-account` такої збірки в exports немає — він завжди
        // звичайний. Виходять дві копії коду кошика, і зв'язок кошика з кабінетом
        // (createCustomerAccountServerHandlers({ cartServerHandlers })) падає з помилкою
        // «cartServerHandlers must be created by createCartServerHandlers with the
        // customerSession option». Тож і корінь пакета беремо зі звичайної збірки:
        // експорти в обох однакові, у продакшн-збірці так є і без цього.
        find: /^@shopify\/hydrogen$/,
        replacement: fileURLToPath(
          new URL("./node_modules/@shopify/hydrogen/dist/core/index.mjs", import.meta.url),
        ),
      },
    ],
  },
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * For example, for the following error:
       *
       * > ReferenceError: module is not defined
       * >   at /Users/.../node_modules/example-dep/index.js:1:1
       *
       * Include 'example-dep' in the array below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server",
        "react-router > set-cookie-parser",
        "react-router > cookie",
        "react-router",
      ],
    },
  },
  server: {
    allowedHosts: [".tryhydrogen.dev"],
  },
});
