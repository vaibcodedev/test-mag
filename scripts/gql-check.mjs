// Перевірка GraphQL-документів проти схем Storefront API та Customer Account API,
// що постачаються разом з @shopify/hydrogen.
//
// TODO: прибрати цей файл і повернути `hydrogen gql check --fail-on-warn` у скрипт
// `typecheck`, коли Hydrogen виправить роботу на Windows. Зараз `hydrogen gql check`
// передає у gql.tada абсолютний шлях до схеми (`C:\...`), а gql.tada розпізнає його
// як URL зі схемою `c:` і намагається завантажити схему з мережі ("fetch failed").
// Тут робиться те саме, але з відносними шляхами, які працюють на всіх ОС.
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const root = process.cwd();
const schemaDirectory = "./node_modules/@shopify/hydrogen/dist";
const temporaryTsconfig = join(root, `.hydrogen-gql-${randomUUID()}.json`);
const gqlTadaCli = join(dirname(require.resolve("gql.tada/package.json")), "bin/cli.js");

writeFileSync(
  temporaryTsconfig,
  JSON.stringify({
    extends: "./tsconfig.json",
    compilerOptions: {
      plugins: [
        {
          name: "gql.tada/ts-plugin",
          schemas: [
            {
              name: "storefront",
              schema: `${schemaDirectory}/storefront.schema.json`,
              tadaOutputLocation: "storefront-graphql-env.d.ts",
            },
            {
              name: "customer-account",
              schema: `${schemaDirectory}/customer-account.schema.json`,
              tadaOutputLocation: "customer-account-graphql-env.d.ts",
            },
          ],
          trackFieldUsage: false,
        },
      ],
    },
  }),
  { flag: "wx" },
);

let status = 1;
try {
  const result = spawnSync(
    process.execPath,
    [gqlTadaCli, "check", "--tsconfig", temporaryTsconfig, "--level", "info", "--fail-on-warn"],
    { cwd: root, stdio: "inherit" },
  );
  status = result.status ?? 1;
} finally {
  rmSync(temporaryTsconfig, { force: true });
}
process.exit(status);
